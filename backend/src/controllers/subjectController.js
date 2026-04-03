const Subject = require('../models/Subject');
const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');

// Get all subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { students: req.user.id };
    const subjects = await Subject.find(query);
    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message,
    });
  }
};

// Get subject by ID
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('students', 'name email');
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }
    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subject',
      error: error.message,
    });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    console.error('createSubject error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A module with this name already exists. Please choose a different name.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createModule = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });

    subject.units.push(req.body);
    await subject.save();
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });

    if (!subject.students.includes(studentId)) {
      subject.students.push(studentId);
      await subject.save();
    }

    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, color, icon },
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    console.error('updateSubject error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A module with this name already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMaterialFile = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).send('Subject not found');

    let mat = null;
    for (const unit of subject.units) {
      mat = unit.materials.id(req.params.materialId);
      if (mat) break;
    }
    if (!mat) mat = subject.materials.id(req.params.materialId);
    if (!mat) return res.status(404).send('Material not found');

    if (mat.fileData) {
      res.setHeader('Content-Type', mat.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(mat.name)}"`);
      return res.send(mat.fileData);
    }

    // Fallback: try disk for older uploads
    const filename = path.basename(mat.fileUrl || '');
    if (filename) {
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) return res.sendFile(filePath);
    }

    return res.status(404).json({ success: false, message: 'File data not available' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Not found' });

    // Read file buffer — stored in MongoDB for persistent access
    const fileBuffer = fs.readFileSync(req.file.path);

    let totalPages = 0;
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const parsed = await parser.getInfo();
      await parser.destroy();
      totalPages = parsed.total || 0;
    } catch (e) {
      totalPages = 0;
    }

    const material = {
      name: req.body.name || req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileData: fileBuffer,
      mimeType: req.file.mimetype || 'application/pdf',
      totalPages,
    };

    const unitId = req.body.unitId;
    if (unitId) {
      const unit = subject.units.id(unitId);
      if (unit) {
        unit.materials.push(material);
      } else {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }
    } else {
      subject.materials.push(material);
    }

    await subject.save();
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMaterialPages = async (req, res) => {
  try {
    const { totalPages } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    let mat = null;
    for (const unit of subject.units) {
      mat = unit.materials.id(req.params.materialId);
      if (mat) break;
    }
    if (!mat) mat = subject.materials.id(req.params.materialId);
    if (!mat) return res.status(404).json({ success: false, message: 'Material not found' });

    mat.totalPages = Math.max(0, Number(totalPages) || 0);
    await subject.save();
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Migration: fill in totalPages for all existing materials that are missing it
const getPages = async (fileUrl) => {
  try {
    const filename = path.basename(fileUrl);
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) return 0;
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getInfo();
    await parser.destroy();
    return parsed.total || 0;
  } catch (e) {
    return 0;
  }
};

exports.migratePageCounts = async () => {
  try {
    const subjects = await Subject.find({});
    let updated = 0;
    for (const subject of subjects) {
      let changed = false;
      for (const unit of subject.units) {
        for (const mat of unit.materials) {
          if (!mat.totalPages) {
            mat.totalPages = await getPages(mat.fileUrl);
            if (mat.totalPages > 0) changed = true;
          }
        }
      }
      for (const mat of subject.materials) {
        if (!mat.totalPages) {
          mat.totalPages = await getPages(mat.fileUrl);
          if (mat.totalPages > 0) changed = true;
        }
      }
      if (changed) { await subject.save(); updated++; }
    }
    if (updated > 0) console.log(`Page counts migrated for ${updated} subject(s)`);
  } catch (e) {
    console.error('Page count migration error:', e.message);
  }
};
