const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../../config/database');
const {
  ResourceItem,
  ResourceRequest,
  ResourceProgramme,
  ResourceModule,
  ResourceRating,
  ResourceComment,
  ResourceRequestMessage,
  ResourceLibraryNotification,
  ResourceLibraryNotificationRead
} = require('../models');
const FlashcardService = require('../services/flashcardService');

const getRole = (req) => req.user?.role || req.headers['x-rl-role'] || 'student';

/** Full app admins and dedicated Resource Library admins share the same RL permissions. */
const isRlAdmin = (req) => {
  const r = getRole(req);
  return r === 'admin' || r === 'resource_admin';
};
const getClientUserName = (req) => String(req.headers['x-rl-user-name'] || '').trim();

/** Student can only modify resources they uploaded (authorName matches). Admins can manage any. */
const isResourceUploader = (req, resource) => {
  if (!resource) return false;
  const me = getClientUserName(req).toLowerCase();
  const owner = String(resource.authorName || '').trim().toLowerCase();
  return !!me && !!owner && me === owner;
};

const requireAdmin = (req, res) => {
  if (!isRlAdmin(req)) {
    res.status(403).json({ success: false, message: 'Only resource admin can perform this action.' });
    return false;
  }
  return true;
};

const requireAdminOrUploader = (req, res, resource) => {
  if (isRlAdmin(req)) return true;
  if (isResourceUploader(req, resource)) return true;
  res.status(403).json({
    success: false,
    message: 'You can only edit or delete resources you uploaded.'
  });
  return false;
};

const requireAdminOrUploaderForContent = (req, res, resource) => {
  if (isRlAdmin(req)) return true;
  if (isResourceUploader(req, resource)) return true;
  res.status(403).json({
    success: false,
    message: 'Only the person who uploaded this resource can edit its content.'
  });
  return false;
};

/** Shared NOTES that use the collaborative editor: any named user may edit content/metadata. */
const isCollaborativeNoteResource = (resource) => {
  if (!resource) return false;
  if (String(resource.type || '').toUpperCase() !== 'NOTES') return false;
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  if (tags.some((t) => String(t).toLowerCase().includes('collaborative'))) return true;
  const mime = String(resource.fileMime || '');
  const name = String(resource.fileName || '');
  if (mime.startsWith('text/')) return true;
  if (/\.(txt|md)$/i.test(name)) return true;
  return false;
};

const requireCollaborativeOrAdminOrUploader = (req, res, resource) => {
  if (isCollaborativeNoteResource(resource)) {
    if (!getClientUserName(req)) {
      res.status(400).json({
        success: false,
        message: 'User name is required to edit collaborative notes.'
      });
      return false;
    }
    return true;
  }
  return requireAdminOrUploader(req, res, resource);
};

const requireCollaborativeOrAdminOrUploaderForContent = (req, res, resource) => {
  if (isCollaborativeNoteResource(resource)) {
    if (!getClientUserName(req)) {
      res.status(400).json({
        success: false,
        message: 'User name is required to edit collaborative notes.'
      });
      return false;
    }
    return true;
  }
  return requireAdminOrUploaderForContent(req, res, resource);
};

/** Notify all Resource Library users; actor’s row is auto-marked read so they are not alerted for their own action. */
async function createRlNotification({ kind, resource, requestRow, actorName, detail }) {
  try {
    if (!resource?.id && !requestRow?.id) return;
    const actor = String(actorName || 'Someone').trim() || 'Someone';
    const resourceTitle = resource?.id
      ? String(resource.title || 'Resource').slice(0, 500)
      : String(requestRow.title || 'Request').slice(0, 500);
    const n = await ResourceLibraryNotification.create({
      kind,
      resourceId: resource?.id || null,
      requestId: requestRow?.id || null,
      resourceTitle,
      actorName: actor,
      detail: detail ? String(detail).slice(0, 2000) : null
    });
    const key = actor.toLowerCase();
    if (key) {
      await ResourceLibraryNotificationRead.findOrCreate({
        where: { notificationId: n.id, readerKey: key },
        defaults: { notificationId: n.id, readerKey: key }
      });
    }
  } catch (e) {
    console.error('createRlNotification', e.message);
  }
}

const difficultyToScore = { Easy: 1, Medium: 2, Hard: 3 };
const scoreToDifficulty = (score) => {
  if (score <= 1.5) return 'Easy';
  if (score <= 2.4) return 'Medium';
  return 'Hard';
};

const computeRatingSnapshot = (ratings, fallbackResource = null) => {
  if (!ratings.length) {
    return {
      avgStars: Number(fallbackResource?.rating || 0),
      avgDifficulty: fallbackResource?.difficulty || 'Medium',
      ratingsCount: 0
    };
  }
  const avgStarsRaw = ratings.reduce((s, r) => s + Number(r.stars || 0), 0) / ratings.length;
  const avgDifficultyScore = ratings.reduce((s, r) => s + difficultyToScore[r.difficulty], 0) / ratings.length;
  return {
    avgStars: Number(avgStarsRaw.toFixed(1)),
    avgDifficulty: scoreToDifficulty(avgDifficultyScore),
    ratingsCount: ratings.length
  };
};

const recomputeAverages = async (resourceId) => {
  const ratings = await ResourceRating.findAll({ where: { resourceId } });
  if (!ratings.length) return;
  const avgStars = ratings.reduce((s, r) => s + Number(r.stars), 0) / ratings.length;
  const avgDifficultyScore = ratings.reduce((s, r) => s + difficultyToScore[r.difficulty], 0) / ratings.length;
  await ResourceItem.update(
    {
      rating: Math.max(1, Math.min(5, Math.round(avgStars))),
      difficulty: scoreToDifficulty(avgDifficultyScore)
    },
    { where: { id: resourceId } }
  );
};

const resolveResourceFilePath = (fileUrl) => {
  if (!fileUrl) return null;
  const normalized = String(fileUrl).replace(/^\/+/, '');
  return path.join(__dirname, '..', normalized);
};

exports.getOverview = async (req, res) => {
  const [totalResources, contributors, totalDownloads] = await Promise.all([
    ResourceItem.count(),
    ResourceItem.count({ distinct: true, col: 'author_name' }),
    ResourceItem.sum('downloads')
  ]);
  return res.json({
    success: true,
    data: {
      totalResources,
      contributors,
      totalDownloads: totalDownloads || 0,
      programmesCovered: await ResourceProgramme.count()
    }
  });
};

/** Normalize raw query rows so clients always get camelCase + numbers (pg driver quirks). */
const mapTopQualityRow = (row) => ({
  id: row.id,
  title: row.title,
  type: row.type,
  averageRating: Number(row.averageRating ?? row.averagerating ?? 0),
  ratingsCount: Number(row.ratingsCount ?? row.ratingscount ?? 0)
});

/** Top resources by average star rating from `resource_ratings`; if none, by stored rating/downloads on `resource_items`. */
exports.getTopQualityResources = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `
      SELECT
        ri.id,
        ri.title,
        ri.type,
        ROUND(AVG(rr.stars)::numeric, 2) AS "averageRating",
        COUNT(rr.id)::int AS "ratingsCount"
      FROM resource_ratings rr
      INNER JOIN resource_items ri ON ri.id = rr.resource_id
      GROUP BY ri.id, ri.title, ri.type
      ORDER BY AVG(rr.stars) DESC, COUNT(rr.id) DESC
      LIMIT 3
      `,
      { type: sequelize.QueryTypes.SELECT }
    );
    if (rows.length > 0) {
      return res.json({ success: true, data: rows.map(mapTopQualityRow) });
    }
    const fallback = await sequelize.query(
      `
      SELECT
        id,
        title,
        type,
        COALESCE(rating, 0)::numeric AS "averageRating",
        0 AS "ratingsCount"
      FROM resource_items
      ORDER BY COALESCE(rating, 0) DESC, COALESCE(downloads, 0) DESC, created_at DESC
      LIMIT 3
      `,
      { type: sequelize.QueryTypes.SELECT }
    );
    return res.json({ success: true, data: fallback.map(mapTopQualityRow) });
  } catch (e) {
    console.error('getTopQualityResources', e);
    return res.status(500).json({ success: false, message: 'Could not load quality scores.' });
  }
};

/** Top 3 contributors by upload count (all resource types), independent of client-side resource list filters. */
exports.getTopContributors = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `
      SELECT
        author_name AS "authorName",
        COUNT(*)::int AS uploads,
        COALESCE(SUM(downloads), 0)::int AS "totalDownloads"
      FROM resource_items
      GROUP BY author_name
      ORDER BY COUNT(*) DESC, COALESCE(SUM(downloads), 0) DESC
      LIMIT 3
      `,
      { type: sequelize.QueryTypes.SELECT }
    );
    const data = rows.map((row) => ({
      authorName: String(row.authorName ?? row.authorname ?? 'Unknown').trim() || 'Unknown',
      uploads: Number(row.uploads ?? 0),
      totalDownloads: Number(row.totalDownloads ?? row.totaldownloads ?? 0)
    }));
    return res.json({ success: true, data });
  } catch (e) {
    console.error('getTopContributors', e);
    return res.status(500).json({ success: false, message: 'Could not load contributors.' });
  }
};

exports.getResources = async (req, res) => {
  const { type, search, programmeId, moduleId, limit } = req.query;
  const where = {};
  if (type) where.type = type;
  if (programmeId) where.programmeId = programmeId;
  if (moduleId) where.moduleId = moduleId;
  if (search) where.title = { [Op.iLike]: `%${search}%` };
  const query = {
    where,
    include: [
      { model: ResourceProgramme, attributes: ['id', 'name'] },
      { model: ResourceModule, attributes: ['id', 'name', 'imageUrl'] }
    ],
    order: [['created_at', 'DESC']]
  };
  if (limit) query.limit = Number(limit);

  const rows = await ResourceItem.findAll(query);
  const data = rows.map((r) => ({
    id: r.id,
    programmeId: r.programmeId,
    moduleId: r.moduleId,
    programmeName: r.ResourceProgramme?.name,
    moduleName: r.ResourceModule?.name,
    moduleImageUrl: r.ResourceModule?.imageUrl || null,
    title: r.title,
    description: r.description,
    type: r.type,
    authorName: r.authorName,
    downloads: r.downloads,
    views: r.views ?? 0,
    fileSize: r.fileSize,
    fileUrl: r.fileUrl,
    fileName: r.fileName,
    fileMime: r.fileMime,
    tags: Array.isArray(r.tags) ? r.tags : [],
    rating: r.rating || 0,
    difficulty: r.difficulty || 'Medium'
  }));
  return res.json({ success: true, data });
};

exports.getResourceById = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id, {
    include: [
      { model: ResourceProgramme, attributes: ['id', 'name'] },
      { model: ResourceModule, attributes: ['id', 'name', 'imageUrl'] }
    ]
  });
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

  const ratings = await ResourceRating.findAll({ where: { resourceId: resource.id } });
  const snapshot = computeRatingSnapshot(ratings, resource);
  const userName = String(req.query.userName || '').trim();
  const myRating = userName
    ? ratings.find((r) => String(r.userName || '').trim().toLowerCase() === userName.toLowerCase())
    : null;
  const comments = await ResourceComment.findAll({ where: { resourceId: resource.id }, order: [['createdAt', 'ASC']] });
  const rootComments = comments.filter((c) => !c.parentId).map((c) => ({
    id: c.id,
    authorName: c.authorName,
    text: c.text,
    createdAt: c.createdAt,
    replies: comments
      .filter((r) => r.parentId === c.id)
      .map((r) => ({ id: r.id, authorName: r.authorName, text: r.text, createdAt: r.createdAt }))
  }));

  return res.json({
    success: true,
    data: {
      id: resource.id,
      programmeId: resource.programmeId,
      moduleId: resource.moduleId,
      type: resource.type,
      title: resource.title,
      description: resource.description,
      programmeName: resource.ResourceProgramme?.name,
      moduleName: resource.ResourceModule?.name,
      moduleImageUrl: resource.ResourceModule?.imageUrl || null,
      rating: Math.round(snapshot.avgStars || 0),
      averageRating: snapshot.avgStars || 0,
      difficulty: snapshot.avgDifficulty || 'Medium',
      downloads: resource.downloads || 0,
      views: resource.views || 0,
      uploadedBy: resource.authorName,
      uploadedAt: resource.createdAt,
      fileSize: resource.fileSize,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      fileMime: resource.fileMime,
      tags: Array.isArray(resource.tags) ? resource.tags : [],
      ratingsCount: snapshot.ratingsCount,
      myRating: myRating ? { stars: Number(myRating.stars), difficulty: myRating.difficulty } : null,
      comments: rootComments
    }
  });
};

exports.uploadResource = async (req, res) => {
  const { programmeId, moduleId, title, description } = req.body;
  if (!programmeId || !moduleId || !title || !description) {
    return res.status(400).json({ success: false, message: 'Programme, module, title and description are required.' });
  }
  const parsedTags = String(req.body.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const rating = Math.max(1, Math.min(5, Number(req.body.rating || 3)));
  const difficulty = ['Easy', 'Medium', 'Hard'].includes(req.body.difficulty) ? req.body.difficulty : 'Medium';

  const videoUrl = String(req.body.videoUrl || '').trim();
  const isVideoUrl = /^https?:\/\//i.test(videoUrl);

  if (!req.file) {
    if (!isVideoUrl) {
      return res.status(400).json({ success: false, message: 'Resource file or video URL is required.' });
    }
    const authorName = String(req.body.authorName || '').trim() || 'Student';
    const row = await ResourceItem.create({
      programmeId,
      moduleId,
      title,
      description,
      type: 'VIDEO',
      authorName,
      fileUrl: videoUrl,
      fileName: 'video-link',
      fileMime: 'video/mp4',
      fileSize: null,
      tags: parsedTags,
      rating,
      difficulty
    });
    await createRlNotification({
      kind: 'upload',
      resource: row,
      actorName: row.authorName,
      detail: 'A new resource was uploaded.'
    });
    return res.status(201).json({ success: true, data: row });
  }

  const extension = (req.file.originalname.split('.').pop() || '').toLowerCase();
  let type = 'NOTES';
  if (['ppt', 'pptx'].includes(extension)) type = 'PPT';
  if (['pdf'].includes(extension)) type = 'PDF';
  if (['doc', 'docx', 'txt', 'md'].includes(extension)) type = 'NOTES';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(extension)) type = 'VIDEO';

  // Safety net: never insert a DB row unless the uploaded bytes are actually on disk.
  // This prevents "Cannot GET /uploads/..." later if the write silently failed.
  const writtenPath = req.file.path || path.join(__dirname, '../uploads/resource-library/resources', req.file.filename);
  if (!fs.existsSync(writtenPath)) {
    return res.status(500).json({
      success: false,
      message: 'Upload failed: the file was not saved to disk. Please try again.'
    });
  }

  const authorName = String(req.body.authorName || '').trim() || 'Student';
  const row = await ResourceItem.create({
    programmeId,
    moduleId,
    title,
    description,
    type,
    authorName,
    fileUrl: `/uploads/resource-library/resources/${req.file.filename}`,
    fileName: req.file.originalname,
    fileMime: req.file.mimetype,
    fileSize: req.file.size,
    tags: parsedTags,
    rating,
    difficulty
  });
  await createRlNotification({
    kind: 'upload',
    resource: row,
    actorName: row.authorName,
    detail: 'A new resource was uploaded.'
  });
  return res.status(201).json({ success: true, data: row });
};

exports.recordView = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  await resource.update({ views: (resource.views || 0) + 1 });
  return res.json({ success: true, data: { views: resource.views } });
};

exports.recordDownload = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  await resource.update({ downloads: (resource.downloads || 0) + 1 });
  return res.json({ success: true, data: { downloads: resource.downloads, fileUrl: resource.fileUrl } });
};

exports.submitRating = async (req, res) => {
  const { userName, stars, difficulty } = req.body;
  const cleanUserName = String(userName || '').trim();
  const numericStars = Number(stars);
  const cleanDifficulty = String(difficulty || '').trim();
  if (!cleanUserName || !numericStars || !cleanDifficulty) {
    return res.status(400).json({ success: false, message: 'userName, stars and difficulty are required.' });
  }
  if (numericStars < 1 || numericStars > 5) {
    return res.status(400).json({ success: false, message: 'stars must be between 1 and 5.' });
  }
  if (!['Easy', 'Medium', 'Hard'].includes(cleanDifficulty)) {
    return res.status(400).json({ success: false, message: 'difficulty must be Easy, Medium or Hard.' });
  }
  const existing = await ResourceRating.findOne({
    where: { resourceId: req.params.id, userName: cleanUserName }
  });
  if (existing) {
    await existing.update({ stars: numericStars, difficulty: cleanDifficulty });
  } else {
    await ResourceRating.create({
      resourceId: req.params.id,
      userName: cleanUserName,
      stars: numericStars,
      difficulty: cleanDifficulty
    });
  }
  await recomputeAverages(req.params.id);
  const ratings = await ResourceRating.findAll({ where: { resourceId: req.params.id } });
  return res.json({ success: true, data: computeRatingSnapshot(ratings) });
};

exports.addComment = async (req, res) => {
  const { authorName, text, parentId } = req.body;
  if (!authorName || !text) {
    return res.status(400).json({ success: false, message: 'authorName and text are required.' });
  }
  const row = await ResourceComment.create({
    resourceId: req.params.id,
    authorName,
    text,
    parentId: parentId || null
  });
  return res.status(201).json({ success: true, data: row });
};

/** Comment author (matched by x-rl-user-name) or a resource admin may edit. */
const canModifyComment = (req, comment) => {
  if (!comment) return false;
  if (isRlAdmin(req)) return true;
  const me = getClientUserName(req).toLowerCase();
  const owner = String(comment.authorName || '').trim().toLowerCase();
  return !!me && !!owner && me === owner;
};

exports.updateComment = async (req, res) => {
  const comment = await ResourceComment.findOne({
    where: { id: req.params.commentId, resourceId: req.params.id }
  });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (!canModifyComment(req, comment)) {
    return res.status(403).json({
      success: false,
      message: 'You can only edit comments you posted.'
    });
  }
  const text = String(req.body?.text || '').trim();
  if (!text) {
    return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
  }
  comment.text = text;
  await comment.save();
  return res.json({ success: true, data: comment });
};

exports.deleteComment = async (req, res) => {
  const comment = await ResourceComment.findOne({
    where: { id: req.params.commentId, resourceId: req.params.id }
  });
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  if (!canModifyComment(req, comment)) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete comments you posted.'
    });
  }
  // Also remove direct replies to this comment so the thread isn't left orphaned.
  if (!comment.parentId) {
    await ResourceComment.destroy({ where: { parentId: comment.id } });
  }
  await comment.destroy();
  return res.json({ success: true });
};

exports.getResourceContent = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  const isText = String(resource.fileMime || '').startsWith('text/') || /\.(txt|md)$/i.test(String(resource.fileName || ''));
  const isCollabNote = isCollaborativeNoteResource(resource);
  if (!isText && !isCollabNote) {
    return res.status(400).json({ success: false, message: 'This resource does not support text collaboration.' });
  }
  // If the backing file vanished (older orphaned notes), return empty content so the editor can
  // open and the next save (which self-heals the file) can persist the user's edits.
  const filePath = resolveResourceFilePath(resource.fileUrl);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.json({ success: true, data: { content: '' } });
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return res.json({ success: true, data: { content } });
};

/**
 * Generate flashcards from uploaded resources (PDF / PPT / NOTES only).
 * Skips any `VIDEO` resources by design.
 */
exports.generateFlashcards = async (req, res) => {
  const { resourceIds, cardCount = 20, deckTitle } = req.body || {};

  if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
    return res.status(400).json({ success: false, message: 'resourceIds must be a non-empty array.' });
  }

  try {
    const ids = resourceIds.map((x) => String(x)).filter(Boolean);
    const rows = await ResourceItem.findAll({ where: { id: { [Op.in]: ids } } });
    if (!rows.length) return res.status(404).json({ success: false, message: 'No resources found for the given resourceIds.' });

    const normalizedType = (t) => String(t || '').toUpperCase();

    const allowedTypes = new Set(['PDF', 'NOTES', 'PPT']);
    const videoTypes = new Set(['VIDEO']);

    const videos = rows.filter((r) => videoTypes.has(normalizedType(r.type)));
    if (videos.length) {
      return res.status(400).json({ success: false, message: 'Video resources are not supported for flashcard generation.' });
    }

    const allowed = rows.filter((r) => allowedTypes.has(normalizedType(r.type)));
    if (!allowed.length) {
      return res.status(400).json({ success: false, message: 'Only PDF / PPT / NOTES resources are supported for flashcard generation.' });
    }

    const parts = [];
    for (const r of allowed) {
      const t = normalizedType(r.type);
      if (!r.fileUrl) continue;

      try {
        if (t === 'PDF') {
          parts.push(await FlashcardService.extractTextFromPDF(r.fileUrl));
        } else if (t === 'NOTES') {
          parts.push(await FlashcardService.extractTextFromNotes(r.fileUrl, r.fileMime, r.fileName));
        } else if (t === 'PPT') {
          parts.push(await FlashcardService.extractTextFromPPTX(r.fileUrl));
        }
      } catch (err) {
        const label = r.title || r.fileName || 'resource';
        console.error('[generateFlashcards] extract error', r.id, err?.message || err);
        return res.status(400).json({
          success: false,
          message: `Could not read "${label}": ${err?.message || 'Extraction failed.'}`
        });
      }
    }

    const combinedText = parts.filter(Boolean).join('\n\n---\n\n');
    if (!combinedText || combinedText.trim().length < 120) {
      return res.status(400).json({ success: false, message: 'Not enough extractable text to generate flashcards from the selected resources.' });
    }

    const materialName =
      deckTitle ||
      allowed
        .slice(0, 3)
        .map((r) => r.title)
        .filter(Boolean)
        .join(' + ');

    const generated = await FlashcardService.generateFlashcards(combinedText, materialName, cardCount);
    return res.json({ success: true, data: generated });
  } catch (e) {
    console.error('[generateFlashcards]', e?.message || e);
    return res.status(500).json({ success: false, message: e?.message || 'Flashcard generation failed.' });
  }
};

exports.updateResourceContent = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  if (!requireCollaborativeOrAdminOrUploaderForContent(req, res, resource)) return;

  const isText = String(resource.fileMime || '').startsWith('text/') || /\.(txt|md)$/i.test(String(resource.fileName || ''));
  const isCollabNote = isCollaborativeNoteResource(resource);
  // Non-text, non-collab rows (PDF/PPT/VIDEO) still don't support text collaboration.
  if (!isText && !isCollabNote) {
    return res.status(400).json({ success: false, message: 'This resource does not support text collaboration.' });
  }

  // Resolve (or recover) the on-disk path. Older collaborative notes sometimes lost their
  // backing file because the uploads directory didn't exist when they were originally created.
  // Instead of 404-ing the save and losing the user's edits, we re-materialize the file here.
  let filePath = resolveResourceFilePath(resource.fileUrl);
  if (!filePath) {
    const safeTitle = String(resource.title || 'collaborative-note').replace(/\s+/g, '-').toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeTitle}.md`;
    resource.fileUrl = `/uploads/resource-library/resources/${filename}`;
    resource.fileName = filename;
    resource.fileMime = resource.fileMime || 'text/markdown';
    filePath = resolveResourceFilePath(resource.fileUrl);
  }

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: `Could not prepare storage: ${e.message}` });
  }

  const content = String(req.body.content || '');
  try {
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (e) {
    return res.status(500).json({ success: false, message: `Could not save note content: ${e.message}` });
  }

  try {
    const stat = fs.statSync(filePath);
    resource.fileSize = stat.size;
  } catch { /* size is not critical; ignore */ }

  // Title/description are upload-time parameters → only uploader or resource admin may
  // change them here. Any other collaborator can still save their content edits above.
  const canEditParams = isRlAdmin(req) || isResourceUploader(req, resource);
  if (canEditParams) {
    if (req.body.title) resource.title = String(req.body.title).trim() || resource.title;
    if (req.body.description) resource.description = String(req.body.description).trim() || resource.description;
  }
  await resource.save();
  await createRlNotification({
    kind: 'update',
    resource,
    actorName: getClientUserName(req) || resource.authorName,
    detail: 'Collaborative note content was updated.'
  });
  return res.json({ success: true });
};

exports.updateResource = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  // Resource parameters (title, description, programme, module, tags) may only be changed by
  // the uploader or a resource admin — even for collaborative notes. Everyone else can still
  // edit the **body** of a collab note via `updateResourceContent` below.
  if (!requireAdminOrUploader(req, res, resource)) return;
  const { title, description, programmeId, moduleId, tags } = req.body;
  if (title !== undefined) {
    const t = String(title).trim();
    if (t) resource.title = t;
  }
  if (description !== undefined) resource.description = String(description ?? '').trim();
  if (programmeId !== undefined) resource.programmeId = programmeId || null;
  if (moduleId !== undefined) resource.moduleId = moduleId || null;
  if (tags !== undefined) {
    const parsed = Array.isArray(tags)
      ? tags.map((x) => String(x).trim()).filter(Boolean)
      : String(tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    resource.tags = parsed;
  }
  await resource.save();
  await createRlNotification({
    kind: 'update',
    resource,
    actorName: getClientUserName(req) || resource.authorName,
    detail: 'Resource details were updated.'
  });
  return res.json({ success: true });
};

const inferTypeFromFilename = (originalname) => {
  const extension = (String(originalname || '').split('.').pop() || '').toLowerCase();
  if (['ppt', 'pptx'].includes(extension)) return 'PPT';
  if (['pdf'].includes(extension)) return 'PDF';
  if (['doc', 'docx', 'txt', 'md'].includes(extension)) return 'NOTES';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(extension)) return 'VIDEO';
  return null;
};

const unlinkLocalResourceFile = (fileUrl) => {
  if (!fileUrl || /^https?:\/\//i.test(String(fileUrl))) return;
  const filePath = resolveResourceFilePath(fileUrl);
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      /* ignore */
    }
  }
};

exports.replaceResourceAttachment = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  if (!requireAdminOrUploader(req, res, resource)) return;

  const videoUrl = String(req.body.videoUrl || '').trim();
  const isVideoUrl = /^https?:\/\//i.test(videoUrl);

  if (req.file) {
    // Confirm the new file landed on disk before we overwrite the old attachment row.
    const writtenPath = req.file.path || path.join(__dirname, '../uploads/resource-library/resources', req.file.filename);
    if (!fs.existsSync(writtenPath)) {
      return res.status(500).json({
        success: false,
        message: 'Upload failed: the replacement file was not saved to disk. Please try again.'
      });
    }
    unlinkLocalResourceFile(resource.fileUrl);
    const inferred = inferTypeFromFilename(req.file.originalname);
    resource.type = inferred || resource.type;
    resource.fileUrl = `/uploads/resource-library/resources/${req.file.filename}`;
    resource.fileName = req.file.originalname;
    resource.fileMime = req.file.mimetype;
    resource.fileSize = req.file.size;
    await resource.save();
    await createRlNotification({
      kind: 'update',
      resource,
      actorName: getClientUserName(req) || resource.authorName,
      detail: 'Resource file or attachment was replaced.'
    });
    return res.json({ success: true });
  }

  if (isVideoUrl) {
    unlinkLocalResourceFile(resource.fileUrl);
    resource.type = 'VIDEO';
    resource.fileUrl = videoUrl;
    resource.fileName = 'video-link';
    resource.fileMime = 'video/mp4';
    resource.fileSize = null;
    await resource.save();
    await createRlNotification({
      kind: 'update',
      resource,
      actorName: getClientUserName(req) || resource.authorName,
      detail: 'Video link was updated.'
    });
    return res.json({ success: true });
  }

  return res.status(400).json({
    success: false,
    message: 'Upload a new file or provide a valid http(s) video URL.'
  });
};

exports.deleteResource = async (req, res) => {
  const resource = await ResourceItem.findByPk(req.params.id);
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
  if (!requireAdminOrUploader(req, res, resource)) return;
  const filePath = resolveResourceFilePath(resource.fileUrl);
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (error) { /* ignore file delete failures */ }
  }
  await ResourceRating.destroy({ where: { resourceId: resource.id } });
  await ResourceComment.destroy({ where: { resourceId: resource.id } });
  await resource.destroy();
  return res.json({ success: true });
};

exports.getProgrammes = async (req, res) => {
  const data = await ResourceProgramme.findAll({ order: [['name', 'ASC']] });
  return res.json({ success: true, data });
};

exports.createProgramme = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ success: false, message: 'Programme name is required.' });
  const data = await ResourceProgramme.create({ name });
  return res.status(201).json({ success: true, data });
};

exports.updateProgramme = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const programme = await ResourceProgramme.findByPk(req.params.id);
  if (!programme) return res.status(404).json({ success: false, message: 'Programme not found.' });
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ success: false, message: 'Programme name is required.' });
  programme.name = name;
  await programme.save();
  return res.json({ success: true, data: programme });
};

exports.deleteProgramme = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const programme = await ResourceProgramme.findByPk(req.params.id);
  if (!programme) return res.status(404).json({ success: false, message: 'Programme not found.' });
  const moduleRows = await ResourceModule.findAll({ where: { programmeId: programme.id }, attributes: ['id'] });
  const mids = moduleRows.map((m) => m.id);
  const orConds = [{ programmeId: programme.id }];
  if (mids.length) orConds.push({ moduleId: { [Op.in]: mids } });
  const cnt = await ResourceItem.count({ where: { [Op.or]: orConds } });
  if (cnt > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete: resources are linked to this programme or its modules.'
    });
  }
  await ResourceModule.destroy({ where: { programmeId: programme.id } });
  await programme.destroy();
  return res.json({ success: true });
};

exports.getModules = async (req, res) => {
  const where = {};
  if (req.query.programmeId) where.programmeId = req.query.programmeId;
  const data = await ResourceModule.findAll({ where, order: [['name', 'ASC']] });
  return res.json({ success: true, data });
};

exports.createModule = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { programmeId, name } = req.body;
  if (!programmeId || !name) {
    return res.status(400).json({ success: false, message: 'Programme and module name are required.' });
  }
  const data = await ResourceModule.create({
    programmeId,
    name,
    imageUrl: req.file ? `/uploads/resource-library/modules/${req.file.filename}` : null
  });
  return res.status(201).json({ success: true, data });
};

exports.updateModule = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const module = await ResourceModule.findByPk(req.params.id);
  if (!module) return res.status(404).json({ success: false, message: 'Module not found.' });
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.programmeId) updates.programmeId = req.body.programmeId;
  if (req.file) updates.imageUrl = `/uploads/resource-library/modules/${req.file.filename}`;
  await module.update(updates);
  return res.json({ success: true, data: module });
};

exports.deleteModule = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const row = await ResourceModule.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'Module not found.' });
  const cnt = await ResourceItem.count({ where: { moduleId: row.id } });
  if (cnt > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete: resources are linked to this module.'
    });
  }
  if (row.imageUrl) {
    const imagePath = resolveResourceFilePath(row.imageUrl);
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (error) {
        /* ignore */
      }
    }
  }
  await row.destroy();
  return res.json({ success: true });
};

exports.getRequests = async (req, res) => {
  const requesterName = String(req.query.requestedBy || '').trim();
  const where = {};
  if (!isRlAdmin(req) && requesterName) where.requestedBy = requesterName;
  const rows = await ResourceRequest.findAll({ where, order: [['created_at', 'DESC']] });
  return res.json({ success: true, data: rows });
};

exports.getRequestById = async (req, res) => {
  const request = await ResourceRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
  const me = getClientUserName(req).toLowerCase();
  if (isRlAdmin(req)) {
    return res.json({ success: true, data: request });
  }
  const owner = String(request.requestedBy || '').trim().toLowerCase();
  if (me && owner === me) {
    return res.json({ success: true, data: request });
  }
  return res.status(403).json({ success: false, message: 'You do not have access to this request.' });
};

exports.createRequest = async (req, res) => {
  if (isRlAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Resource admins cannot create requests.' });
  }
  const description = String(req.body.description || req.body.details || '').trim();
  const row = await ResourceRequest.create({
    requestedBy: req.body.requestedBy || 'Student',
    programmeId: req.body.programmeId || null,
    moduleId: req.body.moduleId || null,
    programmeName: req.body.programmeName || null,
    moduleName: req.body.moduleName || null,
    attachmentUrl: req.file ? `/uploads/resource-library/requests/${req.file.filename}` : null,
    attachmentName: req.file ? req.file.originalname : null,
    title: req.body.title,
    description,
    details: description,
    status: ['in_progress', 'resolved'].includes(req.body.status) ? req.body.status : 'in_progress'
  });
  await createRlNotification({
    kind: 'request',
    requestRow: row,
    actorName: row.requestedBy,
    detail: 'A new resource request was submitted.'
  });
  return res.status(201).json({ success: true, data: row });
};

exports.updateRequestStatus = async (req, res) => {
  if (isRlAdmin(req)) {
    return res.status(403).json({ success: false, message: 'Resource admins cannot change request status.' });
  }
  const request = await ResourceRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
  const claimName = String(req.body.requestedBy || '').trim();
  if (!claimName || request.requestedBy !== claimName) {
    return res.status(403).json({ success: false, message: 'You can only update your own requests.' });
  }
  const status = String(req.body.status || '').trim();
  if (!['in_progress', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be in_progress or resolved.' });
  }
  request.status = status;
  await request.save();
  await createRlNotification({
    kind: 'request',
    requestRow: request,
    actorName: claimName,
    detail: `Request status updated to "${status}".`
  });
  return res.json({ success: true, data: request });
};

exports.getRequestMessages = async (req, res) => {
  const rows = await ResourceRequestMessage.findAll({
    where: { requestId: req.params.id },
    order: [['created_at', 'ASC']]
  });
  return res.json({ success: true, data: rows });
};

exports.addRequestMessage = async (req, res) => {
  const senderName = String(req.body.senderName || '').trim();
  const senderRole = isRlAdmin(req) ? 'admin' : 'student';
  const text = String(req.body.message || '').trim();
  const file = req.file;
  if (!senderName) {
    return res.status(400).json({ success: false, message: 'senderName is required.' });
  }
  if (!text && !file) {
    return res.status(400).json({ success: false, message: 'Enter a message or attach a file.' });
  }
  const request = await ResourceRequest.findByPk(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
  const attachmentUrl = file ? `/uploads/resource-library/request-chat/${file.filename}` : null;
  const attachmentName = file ? file.originalname : null;
  const messageContent = text || (file ? `📎 ${file.originalname}` : '');
  const row = await ResourceRequestMessage.create({
    requestId: req.params.id,
    senderName,
    senderRole,
    message: messageContent,
    attachmentUrl,
    attachmentName
  });
  await createRlNotification({
    kind: 'request',
    requestRow: request,
    actorName: senderName,
    detail:
      senderRole === 'admin'
        ? 'Resource admin sent a message on a request.'
        : 'New message on a resource request.'
  });
  return res.status(201).json({ success: true, data: row });
};

exports.updateRequestMessage = async (req, res) => {
  const senderName = String(req.body.senderName || '').trim();
  const text = String(req.body.message || '').trim();
  if (!senderName || !text) {
    return res.status(400).json({ success: false, message: 'senderName and message are required.' });
  }
  const role = isRlAdmin(req) ? 'admin' : 'student';
  const row = await ResourceRequestMessage.findOne({
    where: { id: req.params.messageId, requestId: req.params.id }
  });
  if (!row) return res.status(404).json({ success: false, message: 'Message not found.' });
  if (row.senderName !== senderName || row.senderRole !== role) {
    return res.status(403).json({ success: false, message: 'You can only edit your own messages.' });
  }
  row.message = text;
  await row.save();
  return res.json({ success: true, data: row });
};

exports.deleteRequestMessage = async (req, res) => {
  const senderName = String(req.body.senderName || '').trim();
  if (!senderName) {
    return res.status(400).json({ success: false, message: 'senderName is required.' });
  }
  const role = isRlAdmin(req) ? 'admin' : 'student';
  const row = await ResourceRequestMessage.findOne({
    where: { id: req.params.messageId, requestId: req.params.id }
  });
  if (!row) return res.status(404).json({ success: false, message: 'Message not found.' });
  if (row.senderName !== senderName || row.senderRole !== role) {
    return res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
  }
  await row.destroy();
  return res.json({ success: true });
};

exports.getNotifications = async (req, res) => {
  try {
    const userKey = getClientUserName(req).toLowerCase();
    let rows = await ResourceLibraryNotification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 80
    });
    if (!isRlAdmin(req) && userKey) {
      const reqIds = [...new Set(rows.map((r) => r.requestId).filter(Boolean))];
      let allowedReqIds = new Set();
      if (reqIds.length) {
        const reqs = await ResourceRequest.findAll({ where: { id: reqIds } });
        allowedReqIds = new Set(
          reqs.filter((q) => String(q.requestedBy || '').trim().toLowerCase() === userKey).map((q) => q.id)
        );
      }
      rows = rows.filter((row) => {
        if (!row.requestId) return true;
        return allowedReqIds.has(row.requestId);
      });
    }
    rows = rows.slice(0, 50);
    const ids = rows.map((r) => r.id);
    let readIds = new Set();
    if (userKey && ids.length) {
      const reads = await ResourceLibraryNotificationRead.findAll({
        where: { readerKey: userKey, notificationId: { [Op.in]: ids } },
        attributes: ['notificationId']
      });
      readIds = new Set(reads.map((x) => x.notificationId));
    }
    const notifications = rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      resourceId: r.resourceId,
      requestId: r.requestId,
      resourceTitle: r.resourceTitle,
      actorName: r.actorName,
      detail: r.detail,
      createdAt: r.createdAt,
      read: userKey ? readIds.has(r.id) : false
    }));
    const unreadCount = userKey ? notifications.filter((d) => !d.read).length : notifications.length;
    return res.json({ success: true, data: { notifications, unreadCount } });
  } catch (e) {
    console.error('getNotifications', e);
    return res.status(500).json({ success: false, message: 'Could not load notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  const userKey = getClientUserName(req).toLowerCase();
  if (!userKey) return res.status(400).json({ success: false, message: 'User name required.' });
  const n = await ResourceLibraryNotification.findByPk(req.params.id);
  if (!n) return res.status(404).json({ success: false, message: 'Not found.' });
  await ResourceLibraryNotificationRead.findOrCreate({
    where: { notificationId: n.id, readerKey: userKey },
    defaults: { notificationId: n.id, readerKey: userKey }
  });
  return res.json({ success: true });
};

exports.markAllNotificationsRead = async (req, res) => {
  const userKey = getClientUserName(req).toLowerCase();
  if (!userKey) return res.status(400).json({ success: false, message: 'User name required.' });
  const rows = await ResourceLibraryNotification.findAll({ attributes: ['id'] });
  await Promise.all(
    rows.map((r) =>
      ResourceLibraryNotificationRead.findOrCreate({
        where: { notificationId: r.id, readerKey: userKey },
        defaults: { notificationId: r.id, readerKey: userKey }
      })
    )
  );
  return res.json({ success: true });
};
