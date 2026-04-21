import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOutlined, LogoutOutlined, UploadOutlined, FileTextOutlined, BarChartOutlined, DownloadOutlined, AppstoreOutlined, EyeOutlined, EditOutlined, HighlightOutlined, UndoOutlined, RedoOutlined, BorderOutlined, RadiusUpleftOutlined, FontSizeOutlined, BgColorsOutlined, ClearOutlined, SaveOutlined, VideoCameraOutlined, TeamOutlined, BoldOutlined, ItalicOutlined, UnderlineOutlined, AlignLeftOutlined, AlignCenterOutlined, AlignRightOutlined, OrderedListOutlined, UnorderedListOutlined, DeleteOutlined, StrikethroughOutlined, LinkOutlined, DisconnectOutlined, TableOutlined, FileImageOutlined, PrinterOutlined, FilePdfOutlined, MessageOutlined, UserOutlined, PaperClipOutlined, FolderOpenOutlined, BankOutlined, CloseOutlined, SendOutlined, CalendarOutlined, ClockCircleOutlined, CheckCircleOutlined, StarOutlined, BellOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Divider, Dropdown, Form, Input, Modal, Popconfirm, Rate, Select, Spin, Upload, message } from 'antd';
import { useAuth } from '../hooks/useAuth';
import resourceLibraryService from '../services/resourceLibrary.service';
import './ResourceLibraryDashboard.css';
import FlashcardsPage from './FlashcardsPage';
import LibraryAdvancedFilters, {
  defaultLibraryFilters,
  defaultNoteFilters,
  matchesLibraryFilters,
} from '../components/resourceLibrary/LibraryAdvancedFilters';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const RL_PATH_TO_PAGE = {
  dashboard: 'dashboard',
  resources: 'resources',
  notes: 'notes',
  flashcards: 'flashcards',
  requests: 'requests',
};

const RL_NAV = {
  dashboard: '/resource-library/dashboard',
  resources: '/resource-library/resources',
  notes: '/resource-library/notes',
  flashcards: '/resource-library/flashcards',
  requests: '/resource-library/requests',
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (String(url).startsWith('http://') || String(url).startsWith('https://')) return url;
  return `${API_ORIGIN}${String(url).startsWith('/') ? '' : '/'}${url}`;
};

/** Returns https://www.youtube.com/embed/ID for watch/shorts/youtu.be URLs, or null */
const getYouTubeEmbedUrl = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();
  let u;
  try {
    u = new URL(s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be') {
    const id = u.pathname.replace(/^\//, '').split('/')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (u.pathname.startsWith('/embed/')) {
      const id = u.pathname.split('/embed/')[1]?.split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.pathname.startsWith('/shorts/')) {
      const id = u.pathname.split('/shorts/')[1]?.split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}`;
  }
  return null;
};

const isVideoResource = (r) =>
  String(r?.type || '').toUpperCase() === 'VIDEO' || String(r?.fileMime || '').startsWith('video');

const isExternalVideoUrl = (r) =>
  isVideoResource(r) && r?.fileUrl && /^https?:\/\//i.test(String(r.fileUrl));

/** Text-style NOTES created for the collaborative editor (Notes page). */
const isCollaborativeNoteResource = (r) => {
  if (String(r?.type || '').toUpperCase() !== 'NOTES') return false;
  const tags = Array.isArray(r.tags) ? r.tags : [];
  if (tags.some((t) => String(t).toLowerCase().includes('collaborative'))) return true;
  const mime = String(r?.fileMime || '');
  const name = String(r?.fileName || '');
  if (mime.startsWith('text/')) return true;
  if (/\.(txt|md)$/i.test(name)) return true;
  return false;
};

/**
 * Resource **detail** page: show Word-style collaborative editor instead of PDF/video preview.
 * Backend `getResourceById` must include `type`; this also infers legacy/missing `type` when safe.
 */
const detailsPageShowsCollaborativeEditor = (details) => {
  if (!details) return false;
  if (String(details.type || '').toUpperCase() === 'NOTES') return true;
  if (isCollaborativeNoteResource(details)) return true;
  const tags = Array.isArray(details.tags) ? details.tags : [];
  const mime = String(details.fileMime || '');
  const name = String(details.fileName || '');
  const textLike =
    mime.startsWith('text/') ||
    /\.(txt|md|html)$/i.test(name) ||
    /\.(doc|docx)$/i.test(name);
  const desc = String(details.description || '').toLowerCase();
  const collabHint =
    tags.some((t) => String(t).toLowerCase().includes('collaborative')) || desc.includes('collaborative');
  return collabHint && textLike;
};

const YouTubeVideoLink = ({ href, className = '' }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`rl-youtube-link${className ? ` ${className}` : ''}`}
      title="Open video"
      onClick={(e) => e.stopPropagation()}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#FF0000"
          d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        />
        <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    </a>
  );
};

const ResourceLibraryDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams();
  const prevRlSectionRef = useRef(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'resource_admin';
  /** Resource admins may edit any resource; students may only edit/delete what they uploaded (authorName matches user name). */
  const canManageResource = (r) => {
    if (!r) return false;
    if (isAdmin) return true;
    const owner = String(r.authorName ?? r.uploadedBy ?? '').trim().toLowerCase();
    const me = String(user?.name || '').trim().toLowerCase();
    return !!me && !!owner && me === owner;
  };
  const canManageResourceById = (id) => {
    if (!id) return false;
    const fromList = resources.find((x) => x.id === id);
    if (fromList) return canManageResource(fromList);
    if (resourceDetails?.id === id) return canManageResource({ authorName: resourceDetails.uploadedBy });
    return false;
  };

  /** Collaborative NOTES: any user may edit body/title; delete still uses {@link canManageResourceById}. */
  const canEditCollaborativeNoteContentById = (id) => {
    if (!id) return false;
    const fromList = resources.find((x) => x.id === id);
    const details = resourceDetails?.id === id ? resourceDetails : null;
    const r = fromList || details;
    if (!r) return false;
    if (isCollaborativeNoteResource(r)) return true;
    return canManageResource(r);
  };
  const [activePage, setActivePage] = useState('dashboard');
  const [overview, setOverview] = useState({ totalResources: 0, contributors: 0, totalDownloads: 0, programmesCovered: 0 });
  const [topQualityResources, setTopQualityResources] = useState([]);
  const [topContributorsList, setTopContributorsList] = useState([]);
  const [resources, setResources] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [resourceDetails, setResourceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [replyTextByComment, setReplyTextByComment] = useState({});
  const [commentText, setCommentText] = useState('');
  const [myStars, setMyStars] = useState(3);
  const [myDifficulty, setMyDifficulty] = useState('Medium');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [openUpload, setOpenUpload] = useState(false);
  const [openRequest, setOpenRequest] = useState(false);
  const [openRequestChat, setOpenRequestChat] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [requestMessages, setRequestMessages] = useState([]);
  const [requestMessageText, setRequestMessageText] = useState('');
  const [requestEditMessageId, setRequestEditMessageId] = useState(null);
  const [requestEditText, setRequestEditText] = useState('');
  const requestChatScrollRef = useRef(null);
  const requestChatFileInputRef = useRef(null);
  const [requestChatFile, setRequestChatFile] = useState(null);
  const [requestEvidenceFile, setRequestEvidenceFile] = useState(null);
  const [openProgramme, setOpenProgramme] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [programmeEditAwaitingPick, setProgrammeEditAwaitingPick] = useState(false);
  const [programmeEditModules, setProgrammeEditModules] = useState([]);
  const [openModule, setOpenModule] = useState(false);
  const [openWhiteboard, setOpenWhiteboard] = useState(false);
  const [openNewNoteModal, setOpenNewNoteModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [resourceFile, setResourceFile] = useState(null);
  const [uploadKind, setUploadKind] = useState('file');
  const [moduleImageFile, setModuleImageFile] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [libraryFilters, setLibraryFilters] = useState(() => ({ ...defaultLibraryFilters }));
  const [noteFilters, setNoteFilters] = useState(() => ({ ...defaultNoteFilters }));
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [rlNotifications, setRlNotifications] = useState([]);
  const [rlUnread, setRlUnread] = useState(0);
  const [uploadForm] = Form.useForm();
  const [requestForm] = Form.useForm();
  const [programmeForm] = Form.useForm();
  const [moduleForm] = Form.useForm();
  const [editResourceForm] = Form.useForm();
  const [newNoteForm] = Form.useForm();
  const [openEditResource, setOpenEditResource] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editingResourceSnapshot, setEditingResourceSnapshot] = useState(null);
  const [editResourceAttachmentFile, setEditResourceAttachmentFile] = useState(null);
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });
  const previewSnapshotRef = useRef(null);
  const [drawColor, setDrawColor] = useState('#2f4ec9');
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const [showGrid, setShowGrid] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const noteEditorRef = useRef(null);
  const imageInputRef = useRef(null);

  const loadResourceDetailView = useCallback(async (resourceId) => {
    setActivePage('resource-details');
    setSelectedResourceId(resourceId);
    setDetailsLoading(true);
    await resourceLibraryService.recordView(resourceId);
    const res = await resourceLibraryService.getResourceById(resourceId, { userName: user?.name || 'Student' });
    setResourceDetails(res.data);
    if (res.data?.myRating) {
      setMyStars(Number(res.data.myRating.stars || 3));
      setMyDifficulty(res.data.myRating.difficulty || 'Medium');
    } else {
      setMyStars(3);
      setMyDifficulty('Medium');
    }
    setDetailsLoading(false);
  }, [user?.name]);

  const openResourceDetails = useCallback(
    async (resourceId) => {
      if (section === 'dashboard' || section === 'requests') {
        navigate('/resource-library/resources', { state: { openResourceId: resourceId } });
        return;
      }
      await loadResourceDetailView(resourceId);
    },
    [section, navigate, loadResourceDetailView]
  );

  const goBackFromResourceDetails = useCallback(() => {
    const page = RL_PATH_TO_PAGE[section] || 'resources';
    setActivePage(page);
    setResourceDetails(null);
    setSelectedResourceId(null);
  }, [section]);

  useEffect(() => {
    const page = RL_PATH_TO_PAGE[section];
    if (!section || !page) {
      navigate('/resource-library/dashboard', { replace: true });
      return;
    }

    const openId = location.state && location.state.openResourceId;
    if (openId && page === 'resources') {
      navigate(location.pathname, { replace: true, state: {} });
      prevRlSectionRef.current = section;
      void loadResourceDetailView(openId);
      return;
    }

    const sectionChanged = prevRlSectionRef.current !== section;
    prevRlSectionRef.current = section;

    if (sectionChanged) {
      setActivePage(page);
      if (page === 'notes') setSelectedNoteId(null);
      setSelectedResourceId(null);
      setResourceDetails(null);
    }
  }, [section, location.pathname, location.state, navigate, loadResourceDetailView]);

  const loadOverview = async () => {
    try {
      const res = await resourceLibraryService.getOverview();
      setOverview(res.data || {});
    } catch {
      setOverview({ totalResources: 0, contributors: 0, totalDownloads: 0, programmesCovered: 0 });
    }
  };

  const unwrapApiList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const loadTopQuality = async () => {
    try {
      const res = await resourceLibraryService.getTopQualityResources();
      setTopQualityResources(unwrapApiList(res));
    } catch {
      setTopQualityResources([]);
    }
  };

  const loadTopContributors = async () => {
    try {
      const res = await resourceLibraryService.getTopContributors();
      setTopContributorsList(unwrapApiList(res));
    } catch {
      setTopContributorsList([]);
    }
  };

  const loadResources = async (type = null) => {
    try {
      const res = await resourceLibraryService.getResources(type ? { type } : {});
      setResources(res.data || []);
    } catch {
      setResources([]);
    }
  };

  const loadRecentResources = async () => {
    try {
      const res = await resourceLibraryService.getResources({ limit: 3 });
      setRecentResources(res.data || []);
    } catch {
      setRecentResources([]);
    }
  };

  const loadProgrammes = async () => {
    try {
      const res = await resourceLibraryService.getProgrammes();
      setProgrammes(res.data || []);
    } catch {
      setProgrammes([]);
    }
  };

  const loadModules = async (programmeId) => {
    if (!programmeId) {
      setModules([]);
      return;
    }
    try {
      const res = await resourceLibraryService.getModules(programmeId);
      setModules(res.data || []);
    } catch {
      setModules([]);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await resourceLibraryService.getRequests(isAdmin ? {} : { requestedBy: user?.name || 'Student' });
      setRequests(res.data || []);
    } catch {
      setRequests([]);
    }
  };

  const loadRlNotifications = async () => {
    try {
      const res = await resourceLibraryService.getNotifications();
      if (res?.success && res.data) {
        setRlNotifications(res.data.notifications || []);
        setRlUnread(res.data.unreadCount ?? 0);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadRlNotifications();
    const id = setInterval(loadRlNotifications, 45000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadOverview();
    loadTopQuality();
    loadTopContributors();
    loadResources();
    loadRecentResources();
    loadRequests();
    loadProgrammes();
  }, []);

  useEffect(() => {
    if (activePage === 'resources') loadResources();
    if (activePage === 'notes') loadResources('NOTES');
    // For the flashcards page we generate decks from PDFs / Slides / Notes,
    // so we load all resources and filter inside <FlashcardsPage />.
    if (activePage === 'flashcards') loadResources();
    if (activePage === 'requests') loadRequests();
    if (activePage === 'dashboard') {
      loadTopQuality();
      loadTopContributors();
      loadOverview();
    }
  }, [activePage]);

  // Sync editor from React state when the note or `noteContent` changes (e.g. after load).
  // Do NOT depend on `resourceDetails`: that object is often replaced after comments, ratings,
  // downloads, etc. `noteContent` is not updated on every keystroke (only the DOM is), so
  // re-running this when `resourceDetails` reference changes would reset the editor to stale
  // state and wipe the user's edits.
  useEffect(() => {
    const isNotesEditorVisible =
      activePage === 'notes' ||
      (activePage === 'resource-details' && detailsPageShowsCollaborativeEditor(resourceDetails));

    if (isNotesEditorVisible && noteEditorRef.current && typeof noteContent === 'string') {
      noteEditorRef.current.innerHTML = noteContent;
    }
  }, [activePage, selectedNoteId, noteContent]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!openProgramme || !editingProgramme?.id) {
        setProgrammeEditModules([]);
        return;
      }
      try {
        const res = await resourceLibraryService.getModules(editingProgramme.id);
        const list = res?.data;
        if (!cancelled) setProgrammeEditModules(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setProgrammeEditModules([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openProgramme, editingProgramme]);

  useEffect(() => {
    if (!openRequestChat || !activeRequest?.id) return undefined;
    const interval = setInterval(async () => {
      const refreshed = await resourceLibraryService.getRequestMessages(activeRequest.id);
      setRequestMessages(refreshed.data || []);
    }, 3000);
    return () => clearInterval(interval);
  }, [openRequestChat, activeRequest?.id]);

  useEffect(() => {
    if (!openRequestChat || !requestChatScrollRef.current) return;
    const el = requestChatScrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [openRequestChat, requestMessages]);

  const recent = useMemo(() => recentResources, [recentResources]);

  const maxTopContributors = useMemo(() => {
    const max = (topContributorsList || []).reduce((m, c) => Math.max(m, Number(c.uploads || 0)), 0);
    return max || 1;
  }, [topContributorsList]);

  const resourceDetailsIsCollaborativeNote = useMemo(
    () => detailsPageShowsCollaborativeEditor(resourceDetails),
    [resourceDetails]
  );

  const programmeFilterOptions = useMemo(() => {
    const m = new Map();
    (resources || []).forEach((r) => {
      if (r.programmeId && r.programmeName) m.set(r.programmeId, r.programmeName);
    });
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [resources]);

  const moduleOptionsLib = useMemo(() => {
    const map = new Map();
    (resources || []).forEach((r) => {
      if (libraryFilters.programmeId && r.programmeId !== libraryFilters.programmeId) return;
      if (r.moduleId && r.moduleName) map.set(r.moduleId, r.moduleName);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [resources, libraryFilters.programmeId]);

  const moduleOptionsNotes = useMemo(() => {
    const map = new Map();
    (resources || []).forEach((r) => {
      if (noteFilters.programmeId && r.programmeId !== noteFilters.programmeId) return;
      if (r.moduleId && r.moduleName) map.set(r.moduleId, r.moduleName);
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
  }, [resources, noteFilters.programmeId]);

  const filteredResourcesList = useMemo(
    () => (resources || []).filter((r) => matchesLibraryFilters(r, libraryFilters, { includeType: true })),
    [resources, libraryFilters]
  );

  const filteredNotesList = useMemo(
    () => (resources || []).filter((r) => matchesLibraryFilters(r, noteFilters, { includeType: false })),
    [resources, noteFilters]
  );

  const cards = [
    { title: 'Total Resources', value: overview.totalResources || 0, icon: <FileTextOutlined />, tone: 'blue' },
    { title: 'Contributors', value: overview.contributors || 0, icon: <BarChartOutlined />, tone: 'orange' },
    { title: 'Total Downloads', value: overview.totalDownloads || 0, icon: <DownloadOutlined />, tone: 'green' },
    { title: 'Programmes Covered', value: overview.programmesCovered || 0, icon: <AppstoreOutlined />, tone: 'purple' },
  ];

  const openEditResourceModal = async (r) => {
    setEditingResourceId(r.id);
    setEditingResourceSnapshot({
      authorName: r.authorName,
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      type: r.type,
      tags: r.tags,
      fileMime: r.fileMime
    });
    setEditResourceAttachmentFile(null);
    editResourceForm.resetFields();
    try {
      await loadModules(r.programmeId);
    } catch {
      /* still allow editing metadata */
    }
    editResourceForm.setFieldsValue({
      programmeId: r.programmeId,
      moduleId: r.moduleId,
      title: r.title,
      description: r.description,
      tags: Array.isArray(r.tags) ? r.tags.join(', ') : '',
      replaceVideoUrl: isExternalVideoUrl(r) ? r.fileUrl : undefined
    });
    setOpenEditResource(true);
  };

  const saveEditedResource = async (values) => {
    const id = editingResourceId;
    if (!id) return;
    const row = resources.find((x) => x.id === id);
    const authorName = row?.authorName ?? editingResourceSnapshot?.authorName;
    const meta = row || {
      type: editingResourceSnapshot?.type,
      tags: editingResourceSnapshot?.tags,
      fileMime: editingResourceSnapshot?.fileMime,
      fileName: editingResourceSnapshot?.fileName
    };
    if (!canManageResource({ authorName }) && !isCollaborativeNoteResource(meta)) {
      message.error('You can only edit resources you uploaded.');
      return;
    }
    try {
      await resourceLibraryService.updateResource(
        id,
        {
          programmeId: values.programmeId,
          moduleId: values.moduleId,
          title: values.title,
          description: values.description,
          tags: String(values.tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        },
        user?.role
      );
      if (editResourceAttachmentFile) {
        const fd = new FormData();
        fd.append('resourceFile', editResourceAttachmentFile);
        await resourceLibraryService.replaceResourceAttachment(id, fd, user?.role);
      } else {
        const snap = editingResourceSnapshot;
        const newUrl = String(values.replaceVideoUrl || '').trim();
        if (snap && isVideoResource(snap) && newUrl && newUrl !== String(snap.fileUrl || '')) {
          const fd = new FormData();
          fd.append('videoUrl', newUrl);
          await resourceLibraryService.replaceResourceAttachment(id, fd, user?.role);
        }
      }
      message.success('Resource updated.');
      setOpenEditResource(false);
      setEditingResourceId(null);
      setEditingResourceSnapshot(null);
      setEditResourceAttachmentFile(null);
      editResourceForm.resetFields();
      loadOverview();
      loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
      loadRecentResources();
      if (selectedResourceId === id) {
        const res = await resourceLibraryService.getResourceById(id, { userName: user?.name || 'Student' });
        setResourceDetails(res.data);
      }
      await loadRlNotifications();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not update resource.');
    }
  };

  const confirmDeleteResource = (r) => {
    Modal.confirm({
      title: 'Delete this resource?',
      content: `"${r.title}" will be removed permanently.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      className: 'rl-delete-confirm-modal',
      onOk: async () => {
        if (!canManageResource(r)) {
          message.error('You can only delete resources you uploaded.');
          return;
        }
        try {
          await resourceLibraryService.deleteResource(r.id, user?.role);
          message.success('Resource deleted.');
          if (selectedResourceId === r.id) {
            setSelectedResourceId(null);
            setResourceDetails(null);
          }
          if (selectedNoteId === r.id) {
            setSelectedNoteId(null);
            setNoteContent('');
            setNoteTitle('');
            setNoteDescription('');
          }
          loadOverview();
          loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
          loadRecentResources();
          loadTopQuality();
          loadTopContributors();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Could not delete resource.');
        }
      }
    });
  };

  const createResource = async (values) => {
    if (uploadKind === 'video') {
      const url = String(values.videoUrl || '').trim();
      if (!url) {
        message.error('Please enter a video URL.');
        return;
      }
      if (!/^https?:\/\//i.test(url)) {
        message.error('Please enter a valid URL starting with http:// or https://');
        return;
      }
      const formData = new FormData();
      formData.append('programmeId', values.programmeId);
      formData.append('moduleId', values.moduleId);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('tags', values.tags || '');
      formData.append('authorName', user?.name || 'Student');
      formData.append('videoUrl', url);
      await resourceLibraryService.uploadResource(formData, user?.role);
      setOpenUpload(false);
      uploadForm.resetFields();
      setResourceFile(null);
      setUploadKind('file');
      loadOverview();
      loadResources();
      loadRecentResources();
      loadTopQuality();
      loadTopContributors();
    await loadRlNotifications();
    navigate(RL_NAV.resources);
      return;
    }
    let effectiveFile = resourceFile;
    if (uploadKind === 'collab') {
      if (!values.noteContent || !values.noteContent.trim()) {
        message.error('Please enter collaborative note content.');
        return;
      }
      const noteBlob = new Blob([values.noteContent], { type: 'text/plain' });
      effectiveFile = new File([noteBlob], `${(values.title || 'collaborative-note').replace(/\s+/g, '-').toLowerCase()}.txt`, { type: 'text/plain' });
    }
    if (!effectiveFile) {
      message.error('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('programmeId', values.programmeId);
    formData.append('moduleId', values.moduleId);
    formData.append('title', values.title);
    formData.append('description', values.description);
    formData.append('tags', values.tags || '');
    formData.append('authorName', user?.name || 'Student');
    formData.append('resourceFile', effectiveFile);
    await resourceLibraryService.uploadResource(formData, user?.role);
    setOpenUpload(false);
    uploadForm.resetFields();
    setResourceFile(null);
    setUploadKind('file');
    loadOverview();
    loadResources();
    loadRecentResources();
    loadTopQuality();
    loadTopContributors();
    await loadRlNotifications();
    navigate(RL_NAV.resources);
  };

  const saveProgramme = async (values) => {
    try {
      if (editingProgramme) {
        await resourceLibraryService.updateProgramme(editingProgramme.id, { name: values.name }, user?.role);
        message.success('Programme updated.');
      } else {
        await resourceLibraryService.createProgramme({ name: values.name }, user?.role);
        message.success('Programme created.');
      }
      setOpenProgramme(false);
      setEditingProgramme(null);
      setProgrammeEditAwaitingPick(false);
      programmeForm.resetFields();
      loadProgrammes();
      loadOverview();
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not save programme.');
    }
  };

  const openEditProgrammeFromUpload = () => {
    const pid = uploadForm.getFieldValue('programmeId');
    if (pid) {
      const p = programmes.find((x) => x.id === pid);
      if (!p) return;
      setProgrammeEditAwaitingPick(false);
      setEditingProgramme(p);
      programmeForm.setFieldsValue({ name: p.name });
      setOpenProgramme(true);
      return;
    }
    setEditingProgramme(null);
    programmeForm.resetFields();
    setProgrammeEditAwaitingPick(true);
    setOpenProgramme(true);
  };

  const openEditModuleFromUpload = () => {
    const selectedId = uploadForm.getFieldValue('moduleId');
    const selected = modules.find((mod) => mod.id === selectedId);
    if (!selected) {
      message.info('Select a module first.');
      return;
    }
    setEditingModule(selected);
    moduleForm.setFieldsValue({ programmeId: selected.programmeId, name: selected.name });
    setOpenModule(true);
  };

  const refreshProgrammeEditModules = async (programmeId) => {
    if (!programmeId) return;
    const res = await resourceLibraryService.getModules(programmeId);
    const list = res?.data;
    setProgrammeEditModules(Array.isArray(list) ? list : []);
  };

  const deleteModuleInProgrammeEditor = (mod) => {
    if (!editingProgramme || !isAdmin) return;
    Modal.confirm({
      title: 'Delete this module?',
      content: `“${mod.name}” will be removed if no resources use it.`,
      okText: 'Delete',
      okType: 'danger',
      wrapClassName: 'rl-light-confirm-modal',
      onOk: async () => {
        try {
          await resourceLibraryService.deleteModule(mod.id, user?.role);
          message.success('Module deleted.');
          await refreshProgrammeEditModules(editingProgramme.id);
          const pidUpload = uploadForm.getFieldValue('programmeId');
          if (pidUpload === editingProgramme.id) {
            await loadModules(editingProgramme.id);
            const mid = uploadForm.getFieldValue('moduleId');
            if (mid === mod.id) uploadForm.setFieldsValue({ moduleId: undefined });
          }
          loadOverview();
          loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
          loadRecentResources();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Could not delete module.');
        }
      }
    });
  };

  const deleteProgrammeFromEditorModal = () => {
    if (!editingProgramme || !isAdmin) return;
    Modal.confirm({
      title: 'Delete this programme?',
      content: `“${editingProgramme.name}” and its empty modules will be removed. Not allowed if any resources still use them.`,
      okText: 'Delete',
      okType: 'danger',
      wrapClassName: 'rl-light-confirm-modal',
      onOk: async () => {
        try {
          await resourceLibraryService.deleteProgramme(editingProgramme.id, user?.role);
          message.success('Programme deleted.');
          setOpenProgramme(false);
          setEditingProgramme(null);
          setProgrammeEditAwaitingPick(false);
          programmeForm.resetFields();
          setProgrammeEditModules([]);
          uploadForm.setFieldsValue({ programmeId: undefined, moduleId: undefined });
          setModules([]);
          loadProgrammes();
          loadOverview();
          loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
          loadRecentResources();
        } catch (e) {
          message.error(e?.response?.data?.message || 'Could not delete programme.');
        }
      }
    });
  };

  const createOrUpdateModule = async (values) => {
    const formData = new FormData();
    formData.append('programmeId', values.programmeId);
    formData.append('name', values.name);
    if (moduleImageFile) formData.append('moduleImage', moduleImageFile);
    if (editingModule) {
      await resourceLibraryService.updateModule(editingModule.id, formData, user?.role);
    } else {
      await resourceLibraryService.createModule(formData, user?.role);
    }
    setOpenModule(false);
    setEditingModule(null);
    setModuleImageFile(null);
    moduleForm.resetFields();
    loadModules(values.programmeId);
  };

  const createRequest = async (values) => {
    if (isAdmin) {
      message.warning('Resource admins cannot create requests.');
      return;
    }
    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    formData.append('requestedBy', user?.name || 'Student');
    if (requestEvidenceFile) formData.append('evidenceFile', requestEvidenceFile);
    await resourceLibraryService.createRequest(formData);
    setOpenRequest(false);
    requestForm.resetFields();
    setRequestEvidenceFile(null);
    loadRequests();
    await loadRlNotifications();
    navigate(RL_NAV.requests);
  };

  const openChat = async (ticket) => {
    setActiveRequest(ticket);
    setOpenRequestChat(true);
    setRequestEditMessageId(null);
    setRequestEditText('');
    setRequestChatFile(null);
    if (requestChatFileInputRef.current) requestChatFileInputRef.current.value = '';
    const res = await resourceLibraryService.getRequestMessages(ticket.id);
    setRequestMessages(res.data || []);
  };

  const requestChatSenderName = user?.name || (isAdmin ? 'Resource Admin' : 'Student');

  const sendRequestMessage = async () => {
    if (!activeRequest) return;
    const text = requestMessageText.trim();
    if (!text && !requestChatFile) return;
    const fd = new FormData();
    fd.append('senderName', requestChatSenderName);
    fd.append('message', text);
    if (requestChatFile) fd.append('attachment', requestChatFile);
    await resourceLibraryService.addRequestMessage(activeRequest.id, fd, user?.role);
    setRequestMessageText('');
    setRequestChatFile(null);
    if (requestChatFileInputRef.current) requestChatFileInputRef.current.value = '';
    const refreshed = await resourceLibraryService.getRequestMessages(activeRequest.id);
    setRequestMessages(refreshed.data || []);
    await loadRlNotifications();
  };

  const saveRequestMessageEdit = async () => {
    if (!activeRequest || !requestEditMessageId || !requestEditText.trim()) return;
    try {
      await resourceLibraryService.updateRequestMessage(
        activeRequest.id,
        requestEditMessageId,
        { senderName: requestChatSenderName, message: requestEditText.trim() },
        user?.role
      );
      setRequestEditMessageId(null);
      setRequestEditText('');
      const refreshed = await resourceLibraryService.getRequestMessages(activeRequest.id);
      setRequestMessages(refreshed.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not update message.');
    }
  };

  const removeRequestMessage = async (messageId) => {
    if (!activeRequest) return;
    try {
      await resourceLibraryService.deleteRequestMessage(
        activeRequest.id,
        messageId,
        { senderName: requestChatSenderName },
        user?.role
      );
      if (requestEditMessageId === messageId) {
        setRequestEditMessageId(null);
        setRequestEditText('');
      }
      const refreshed = await resourceLibraryService.getRequestMessages(activeRequest.id);
      setRequestMessages(refreshed.data || []);
    } catch (e) {
      message.error(e?.response?.data?.message || 'Could not delete message.');
    }
  };

  const changeRequestStatus = async (ticketId, status) => {
    if (isAdmin) return;
    await resourceLibraryService.updateRequestStatus(
      ticketId,
      { status, requestedBy: user?.name || 'Student' },
      user?.role
    );
    await loadRequests();
    await loadRlNotifications();
  };

  const openCollaborativeNoteDetails = async (note) => {
    if (!note?.id) return;
    // Open the same UI shell as resource details (PDF/video), but replace
    // the preview area with the collaborative note editor.
    await openResourceDetails(note.id);
    await openCollaborativeNote(note);
  };

  const openResourceFromTile = async (resource) => {
    if (String(resource?.type || '').toUpperCase() === 'NOTES' || isCollaborativeNoteResource(resource)) {
      await openCollaborativeNoteDetails(resource);
      return;
    }
    await openResourceDetails(resource.id);
  };

  const submitMyRating = async () => {
    if (!selectedResourceId) return;
    if (!myStars) {
      message.warning('Please choose a star rating first.');
      return;
    }
    setRatingSubmitting(true);
    await resourceLibraryService.submitRating(selectedResourceId, {
      userName: user?.name || 'Student',
      stars: Number(myStars),
      difficulty: myDifficulty
    });
    const res = await resourceLibraryService.getResourceById(selectedResourceId, { userName: user?.name || 'Student' });
    setResourceDetails(res.data);
    loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
    loadRecentResources();
    loadTopQuality();
    loadTopContributors();
    setRatingSubmitting(false);
    message.success('Your rating has been saved.');
  };

  const handleDownload = async () => {
    if (!selectedResourceId) return;
    const res = await resourceLibraryService.recordDownload(selectedResourceId);
    if (res?.data?.fileUrl) {
      const downloadUrl = resolveAssetUrl(res.data.fileUrl);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.download = resourceDetails?.fileName || 'resource';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      message.error('No downloadable file found for this resource.');
    }
    const refreshed = await resourceLibraryService.getResourceById(selectedResourceId);
    setResourceDetails(refreshed.data);
    loadResources(activePage === 'notes' ? 'NOTES' : activePage === 'flashcards' ? 'FLASHCARDS' : null);
    loadRecentResources();
  };

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;
    const width = wrap.clientWidth;
    const height = 460;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const initial = canvas.toDataURL('image/png');
    setHistory([initial]);
    setHistoryIndex(0);
  };

  useEffect(() => {
    if (openWhiteboard) {
      setTimeout(() => initCanvas(), 50);
    }
  }, [openWhiteboard]);

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const snapshot = canvas.toDataURL('image/png');
    const next = history.slice(0, historyIndex + 1);
    next.push(snapshot);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  };

  const restoreHistory = (index) => {
    const canvas = canvasRef.current;
    if (!canvas || index < 0 || index >= history.length) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[index];
    setHistoryIndex(index);
  };

  const startDraw = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const point = getCanvasPoint(event);
    if (!point) return;
    if (tool === 'text') {
      const text = window.prompt('Enter note text');
      if (!text) return;
      ctx.fillStyle = drawColor;
      ctx.font = `${Math.max(14, brushSize * 4)}px Inter, Arial, sans-serif`;
      ctx.fillText(text, point.x, point.y);
      pushHistory();
      return;
    }
    isDrawingRef.current = true;
    startPointRef.current = point;
    previewSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineWidth = brushSize;
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (event) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPoint(event);
    if (!point) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
    ctx.lineWidth = brushSize;
    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      return;
    }
    if (!previewSnapshotRef.current) return;
    ctx.putImageData(previewSnapshotRef.current, 0, 0);
    const { x: startX, y: startY } = startPointRef.current;
    ctx.beginPath();
    if (tool === 'line') {
      ctx.moveTo(startX, startY);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      return;
    }
    if (tool === 'rect') {
      ctx.strokeRect(startX, startY, point.x - startX, point.y - startY);
      return;
    }
    if (tool === 'circle') {
      const radius = Math.hypot(point.x - startX, point.y - startY);
      ctx.arc(startX, startY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const endDraw = () => {
    if (isDrawingRef.current) pushHistory();
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  };

  const saveWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'whiteboard-note.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openCollaborativeNote = async (note) => {
    setSelectedNoteId(note.id);
    setNoteTitle(note.title || '');
    setNoteDescription(note.description || '');
    setNoteLoading(true);
    try {
      const res = await resourceLibraryService.getResourceContent(note.id);
      const content = res.data?.content || '';
      setNoteContent(content);
      if (noteEditorRef.current) noteEditorRef.current.innerHTML = content;
    } catch (error) {
      setNoteContent('');
      message.warning('This note has no editable text content yet.');
    } finally {
      setNoteLoading(false);
    }
  };

  useEffect(() => {
    if (activePage !== 'resource-details' || !resourceDetails?.id) return;
    if (!detailsPageShowsCollaborativeEditor(resourceDetails)) return;
    if (selectedNoteId === resourceDetails.id) return;
    void openCollaborativeNote({
      id: resourceDetails.id,
      title: resourceDetails.title,
      description: resourceDetails.description
    });
  }, [activePage, resourceDetails, selectedNoteId]);

  const goToCollaborativeNoteFromEdit = async () => {
    const id = editingResourceId;
    if (!id) return;
    const title = editResourceForm.getFieldValue('title');
    const description = editResourceForm.getFieldValue('description');
    setOpenEditResource(false);
    setEditingResourceId(null);
    setEditingResourceSnapshot(null);
    setEditResourceAttachmentFile(null);
    editResourceForm.resetFields();
    try {
      const res = await resourceLibraryService.getResources({ type: 'NOTES' });
      const list = res.data || [];
      const note = list.find((n) => n.id === id) || { id, title, description: description || '' };
      await openCollaborativeNoteDetails(note);
    } catch {
      await openCollaborativeNoteDetails({ id, title, description: description || '' });
    }
  };

  const saveCollaborativeNote = async () => {
    if (!selectedNoteId) return;
    if (!canEditCollaborativeNoteContentById(selectedNoteId)) {
      message.error('You can only edit notes you uploaded.');
      return;
    }
    setNoteSaving(true);
    try {
      const html = noteEditorRef.current ? noteEditorRef.current.innerHTML : noteContent;
      await resourceLibraryService.updateResourceContent(
        selectedNoteId,
        {
          title: noteTitle,
          description: noteDescription,
          content: html
        },
        user?.name || 'Student'
      );
      setNoteContent(html);
      message.success('Collaborative note saved.');
      await loadResources('NOTES');
      await loadRlNotifications();
    } finally {
      setNoteSaving(false);
    }
  };

  const formatRlNotifyTime = (d) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const handleRlNotificationClick = async (n) => {
    if (!n.read) {
      try {
        await resourceLibraryService.markNotificationRead(n.id);
      } catch {
        /* ignore */
      }
    }
    await loadRlNotifications();
    if (n.requestId) {
      try {
        const res = await resourceLibraryService.getRequestById(n.requestId);
        if (res?.success && res.data) {
          navigate(RL_NAV.requests);
          await openChat(res.data);
        } else {
          message.warning('Could not open this request.');
        }
      } catch (e) {
        message.warning(e?.response?.data?.message || 'Could not open this request.');
      }
      return;
    }
    if (n.resourceId) {
      await openResourceDetails(n.resourceId);
    }
  };

  const handleMarkAllRlNotificationsRead = async (e) => {
    e?.stopPropagation?.();
    try {
      await resourceLibraryService.markAllNotificationsRead();
      await loadRlNotifications();
    } catch {
      /* ignore */
    }
  };

  const applyWordFormat = (command, value = null) => {
    if (!noteEditorRef.current) return;
    noteEditorRef.current.focus();
    document.execCommand(command, false, value);
    if (noteEditorRef.current) setNoteContent(noteEditorRef.current.innerHTML);
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    applyWordFormat('createLink', url);
  };

  const insertTable = () => {
    const rows = Math.max(1, Number(window.prompt('Number of rows?', '3') || 3));
    const cols = Math.max(1, Number(window.prompt('Number of columns?', '3') || 3));
    const tableRows = Array.from({ length: rows })
      .map(() => `<tr>${Array.from({ length: cols }).map(() => '<td>&nbsp;</td>').join('')}</tr>`)
      .join('');
    const html = `<table class="note-table">${tableRows}</table><p></p>`;
    applyWordFormat('insertHTML', html);
  };

  const triggerImageInsert = () => {
    if (imageInputRef.current) imageInputRef.current.click();
  };

  const handleImageInsert = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const html = `<p><img src="${reader.result}" alt="note-asset" class="note-inline-image" /></p>`;
      applyWordFormat('insertHTML', html);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const openPrintWindow = (isPdfMode = false) => {
    const content = noteEditorRef.current?.innerHTML || '';
    const title = noteTitle || 'Collaborative Note';
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body{font-family:Arial,sans-serif;padding:32px;color:#1f2b4b}
            h1{font-size:26px;margin-bottom:8px}
            .meta{color:#5d6786;margin-bottom:24px}
            table.note-table{width:100%;border-collapse:collapse;margin:12px 0}
            table.note-table td, table.note-table th{border:1px solid #cfd7ea;padding:8px}
            img.note-inline-image{max-width:100%;height:auto;border-radius:6px}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">${noteDescription || ''}</div>
          <div>${content}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      if (!isPdfMode) return;
    }, 300);
  };

  const deleteCollaborativeNote = async (noteId) => {
    const target = resources.find((x) => x.id === noteId) || (resourceDetails?.id === noteId ? { authorName: resourceDetails.uploadedBy } : null);
    if (!canManageResource(target)) {
      message.error('You can only delete notes you uploaded.');
      return;
    }
    if (!window.confirm('Delete this collaborative note? This cannot be undone.')) return;
    await resourceLibraryService.deleteResource(noteId, user?.role);
    message.success('Collaborative note deleted.');
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null);
      setNoteContent('');
      setNoteTitle('');
      setNoteDescription('');
    }
    await loadResources('NOTES');
  };

  const createCollaborativeNote = async (values) => {
    const formData = new FormData();
    formData.append('programmeId', values.programmeId);
    formData.append('moduleId', values.moduleId);
    formData.append('title', values.title);
    formData.append('description', values.description || 'Collaborative notes workspace');
    formData.append('authorName', user?.name || 'Student');
    formData.append('tags', values.tags || 'collaborative,note');
    const seed = values.noteContent || '# New collaborative note\n\nStart writing here...';
    const noteBlob = new Blob([seed], { type: 'text/markdown' });
    const noteFile = new File([noteBlob], `${String(values.title).replace(/\s+/g, '-').toLowerCase()}.md`, { type: 'text/markdown' });
    formData.append('resourceFile', noteFile);
    await resourceLibraryService.uploadResource(formData, user?.role);
    await loadResources('NOTES');
    setOpenNewNoteModal(false);
    newNoteForm.resetFields();
    message.success('Collaborative note created.');
  };
  const undo = () => {
    if (historyIndex > 0) restoreHistory(historyIndex - 1);
  };
  const redo = () => {
    if (historyIndex < history.length - 1) restoreHistory(historyIndex + 1);
  };

  const submitComment = async (parentId = null) => {
    if (!selectedResourceId) return;
    const text = parentId ? (replyTextByComment[parentId] || '') : commentText;
    if (!text.trim()) {
      message.warning(parentId ? 'Reply cannot be empty.' : 'Comment cannot be empty.');
      return;
    }
    try {
      if (parentId) setReplySubmittingId(parentId);
      else setCommentSubmitting(true);
      await resourceLibraryService.addComment(selectedResourceId, {
        authorName: user?.name || 'Student',
        text: text.trim(),
        parentId
      });
      if (parentId) setReplyTextByComment((prev) => ({ ...prev, [parentId]: '' }));
      if (parentId) setActiveReplyId(null);
      else setCommentText('');
      const res = await resourceLibraryService.getResourceById(selectedResourceId, { userName: user?.name || 'Student' });
      setResourceDetails(res.data);
      message.success(parentId ? 'Reply added.' : 'Comment added.');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Unable to post right now.');
    } finally {
      if (parentId) setReplySubmittingId(null);
      else setCommentSubmitting(false);
    }
  };

  const formatSizeKB = (size) => {
    if (!size) return '579.5 KB';
    return `${(size / 1024).toFixed(1)} KB`;
  };
  const stars = (rating = 0) => '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
  const renderAverageStars = (avg) => {
    const value = Number(avg || 0);
    const full = Math.floor(value);
    const empty = Math.max(0, 5 - full);
    return `${'★'.repeat(full)}${'☆'.repeat(empty)}`;
  };
  const formatCommentDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const displayName = user?.name || 'Student';
  const roleLabel = isAdmin ? 'Resource Admin' : 'Student';
  const showRoleLine = displayName.trim().toLowerCase() !== roleLabel.trim().toLowerCase();

  const renderResourceCoverOpenControl = (r) => {
    if (isVideoResource(r) && r.fileUrl) {
      return <YouTubeVideoLink href={resolveAssetUrl(r.fileUrl)} className="rl-youtube-link-cover" />;
    }
    if (String(r?.type || '').toUpperCase() === 'NOTES' || isCollaborativeNoteResource(r)) {
      return (
        <a
          href="#"
          className="rl-open-center-btn"
          title="Open collaborative note"
          aria-label="Open collaborative note"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openResourceFromTile(r);
          }}
        >
          <FileTextOutlined />
        </a>
      );
    }
    if (r?.fileUrl) {
      return (
        <a
          href={resolveAssetUrl(r.fileUrl)}
          target="_blank"
          rel="noreferrer noopener"
          className="rl-open-center-btn"
          title="Open resource"
          onClick={(e) => e.stopPropagation()}
        >
          {String(r.type || '').toUpperCase() === 'PDF' ? (
            <FilePdfOutlined />
          ) : String(r.type || '').toUpperCase() === 'PPT' ? (
            <AppstoreOutlined />
          ) : String(r.type || '').toUpperCase() === 'FLASHCARDS' ? (
            <HighlightOutlined />
          ) : (
            <LinkOutlined />
          )}
        </a>
      );
    }
    return null;
  };

  return (
    <div className="rl-wrap rl-embedded">
      <aside className="rl-side rl-side--internal" aria-hidden="true">
        <div className="rl-brand-wrap">
          <div className="rl-brand">StudySmart<br /><span>RESOURCE LIBRARY</span></div>
        </div>
        <div className="rl-user">
          <div className="rl-avatar">{(user?.name || 'U').charAt(0)}</div>
          <div className="rl-name">{displayName}</div>
          {showRoleLine ? <div className="rl-role">{roleLabel}</div> : null}
        </div>
        <nav className="rl-nav">
          <button className={activePage === 'dashboard' ? 'active' : ''} onClick={() => navigate(RL_NAV.dashboard)}>Dashboard</button>
          <button className={activePage === 'resources' ? 'active' : ''} onClick={() => navigate(RL_NAV.resources)}>Resources</button>
          <button
            className={activePage === 'notes' ? 'active' : ''}
            onClick={() => {
              setSelectedNoteId(null);
              navigate(RL_NAV.notes);
            }}
          >
            Notes
          </button>
          <button className={activePage === 'flashcards' ? 'active' : ''} onClick={() => navigate(RL_NAV.flashcards)}>Flashcards</button>
          <button className={activePage === 'requests' ? 'active' : ''} onClick={() => navigate(RL_NAV.requests)}>Requests</button>
        </nav>
        <div className="rl-side-footer">
          <Dropdown
            trigger={['click']}
            placement="topLeft"
            popupRender={() => (
              <div className="rl-notify-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="rl-notify-header">
                  <span>Notifications</span>
                  {rlUnread > 0 ? (
                    <button type="button" className="rl-notify-mark-all" onClick={handleMarkAllRlNotificationsRead}>
                      Mark all read
                    </button>
                  ) : null}
                </div>
                <div className="rl-notify-list">
                  {rlNotifications.length === 0 ? (
                    <div className="rl-notify-empty">No notifications yet.</div>
                  ) : (
                    rlNotifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`rl-notify-item${n.read ? '' : ' rl-notify-unread'}`}
                        onClick={() => handleRlNotificationClick(n)}
                      >
                        <div className="rl-notify-kind">
                          {n.kind === 'upload' ? 'New upload' : n.kind === 'request' ? 'Request' : 'Updated'}
                        </div>
                        <div className="rl-notify-title">{n.resourceTitle || 'Resource'}</div>
                        <div className="rl-notify-detail">{n.detail}</div>
                        <div className="rl-notify-meta">
                          {n.actorName ? `${n.actorName} · ` : ''}
                          {formatRlNotifyTime(n.createdAt)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          >
            <button type="button" className="rl-notify-bell" aria-label="Notifications">
              <Badge count={rlUnread} size="small" offset={[-2, 2]} overflowCount={99}>
                <BellOutlined />
              </Badge>
            </button>
          </Dropdown>
          <button className="rl-logout" onClick={logout}><LogoutOutlined /> Log out</button>
        </div>
      </aside>

      <main className="rl-main">
        {activePage !== 'flashcards' && activePage !== 'notes' && activePage !== 'requests' && activePage !== 'resource-details' ? (
          <div className="rl-actions">
            {activePage !== 'resources' ? (
              <button type="button" onClick={() => navigate(RL_NAV.resources)}><BookOutlined /> Access Resources</button>
            ) : null}
            <button type="button" onClick={() => setOpenUpload(true)}><UploadOutlined /> Upload Resource</button>
          </div>
        ) : null}

        {activePage === 'dashboard' && (
        <>
        <section className="rl-metrics">
          {cards.map((c) => (
            <div className={`rl-metric ${c.tone}`} key={c.title}>
              <div className="metric-top">
                <span className="metric-icon">{c.icon}</span>
              </div>
              <span className="metric-label">{c.title}</span>
              <strong className="metric-value">{c.value}</strong>
            </div>
          ))}
        </section>

        <div className="rl-title-row">
          <h3 className="rl-title">Recently Added</h3>
          <button className="view-all-btn" onClick={() => navigate(RL_NAV.resources)}>View All</button>
        </div>
        <section className="rl-recent">
          {recent.map((r) => (
            <article className="rl-card" key={r.id}>
              <div className="rl-cover-wrap">
                {r.moduleImageUrl ? (
                  <img src={resolveAssetUrl(r.moduleImageUrl)} alt={r.moduleName} className="rl-cover-image" />
                ) : (
                  <div className="rl-cover" />
                )}
                {renderResourceCoverOpenControl(r)}
                <span className={`rl-type-badge type-${String(r.type || 'NOTES').toLowerCase()}`}>{r.type}</span>
                {(isAdmin || canManageResource(r) || isCollaborativeNoteResource(r)) ? (
                  <div className="rl-card-admin-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="rl-card-icon-btn" title="Edit resource" aria-label="Edit resource" onClick={() => openEditResourceModal(r)}>
                      <EditOutlined />
                    </button>
                    {(isAdmin || canManageResource(r)) ? (
                      <button type="button" className="rl-card-icon-btn rl-card-icon-btn-danger" title="Delete resource" aria-label="Delete resource" onClick={() => confirmDeleteResource(r)}>
                        <DeleteOutlined />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="rl-content">
                <div className="tile-card-head">
                  <div className="tile-card-head-main">
                    <div className="tile-programme">{r.programmeName ? String(r.programmeName).toUpperCase() : '—'}</div>
                    <div className="tile-module">Module: {r.moduleName || '—'}</div>
                  </div>
                  <div className="tile-side-meta">
                    <div className="tile-rating">{stars(r.rating || 0)}</div>
                    <span className={`tile-difficulty ${String(r.difficulty || 'Medium').toLowerCase()}`}>{r.difficulty || 'Medium'}</span>
                  </div>
                </div>
                <h4 className="tile-title-link" onClick={() => openResourceFromTile(r)}>{r.title}</h4>
                <p className="tile-desc">{r.description}</p>
                <div className="tile-divider" />
                <div className="tile-meta">
                  <span>{formatSizeKB(r.fileSize)}</span>
                  <span><EyeOutlined /> {Number(r.views) || 0}</span>
                  <span><DownloadOutlined /> {r.downloads || 0}</span>
                  <span className="tile-meta-open-slot" aria-hidden="true" />
                </div>
                <div className="tile-footer">
                  <div className="tile-footer-author">
                    <span className="tile-avatar">{(r.authorName || 'U').charAt(0)}</span>
                    <span className="tile-author">{r.authorName || '—'}</span>
                  </div>
                  <span className="tile-tag-badge">{(r.tags && r.tags[0]) ? r.tags[0] : '—'}</span>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rl-bottom">
            <div className="rl-dash-panel">
              <header className="rl-dash-panel__head">
                <StarOutlined className="rl-dash-panel__icon" aria-hidden />
                <h4 className="rl-dash-panel__title">Top Quality Scores</h4>
              </header>
              {topQualityResources.length ? (
                <ul className="rl-dash-panel__list" aria-label="Top quality resources">
                  {topQualityResources.slice(0, 3).map((r, idx) => {
                    const score = Number(r.averageRating);
                    const pct = Math.min(100, Math.max(0, (score / 5) * 100));
                    const rank = idx + 1;
                    return (
                      <li key={r.id} className="rl-leader-row rl-leader-row--quality">
                        <div className="rl-leader-row__inner">
                          <span className="rl-leader-rank">{rank}</span>
                          <div className="rl-leader-main">
                            <span className="rl-leader-title">{r.title}</span>
                          </div>
                        </div>
                        <div className="rl-quality-meter">
                          <div className="tile-rating" aria-hidden>
                            {Number.isFinite(score) ? stars(Math.min(5, Math.max(0, Math.round(score)))) : '—'}
                          </div>
                          <div
                            className="rl-quality-meter__bar"
                            role="meter"
                            aria-valuemin={0}
                            aria-valuemax={5}
                            aria-valuenow={Number.isFinite(score) ? score : 0}
                            aria-label={`${Number.isFinite(score) ? score.toFixed(1) : '0'} out of 5 stars`}
                          >
                            <div className="rl-quality-meter__fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rl-dash-panel__empty">No resources or ratings yet.</p>
              )}
            </div>

            <div className="rl-dash-panel">
              <header className="rl-dash-panel__head">
                <TeamOutlined className="rl-dash-panel__icon" aria-hidden />
                <h4 className="rl-dash-panel__title">Top Contributors</h4>
              </header>
              {topContributorsList.length ? (
                <ul className="rl-dash-panel__list" aria-label="Top contributors">
                  {topContributorsList.map((c, idx) => {
                    const uploads = Number(c.uploads || 0);
                    const pct = (uploads / maxTopContributors) * 100;
                    const rank = idx + 1;
                    return (
                      <li key={c.authorName} className="rl-leader-row rl-leader-row--contributor">
                        <div className="rl-leader-row__inner">
                          <span className="rl-leader-rank">{rank}</span>
                          <span className="rl-leader-avatar" aria-hidden="true">
                            {(c.authorName || 'U').charAt(0).toUpperCase()}
                          </span>
                          <div className="rl-leader-main">
                            <span className="rl-leader-title">{c.authorName}</span>
                          </div>
                          <div className="rl-leader-score-block" title="Total uploads">
                            <span className="rl-leader-score-block__num">{uploads}</span>
                            <span className="rl-leader-score-block__den">uploads</span>
                          </div>
                        </div>
                        <div className="rl-upload-meter">
                          <div
                            className="rl-upload-meter__bar"
                            role="meter"
                            aria-valuemin={0}
                            aria-valuemax={maxTopContributors}
                            aria-valuenow={uploads}
                            aria-label={`${uploads} uploads out of ${maxTopContributors} maximum in this list`}
                          >
                            <div className="rl-upload-meter__fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="rl-dash-panel__empty">No contributors yet.</p>
              )}
            </div>
          </section>
        </>
        )}

        {activePage === 'resources' && (
          <>
          <LibraryAdvancedFilters
            variant="resources"
            filters={libraryFilters}
            onChange={setLibraryFilters}
            onClear={() => setLibraryFilters({ ...defaultLibraryFilters })}
            programmeOptions={programmeFilterOptions}
            moduleOptions={moduleOptionsLib}
          />
          <div className="rl-title-row">
            <h3 className="rl-title">Resource Library</h3>
          </div>
          <section className="rl-recent">
            {filteredResourcesList.length === 0 ? (
              <div className="rl-filter-empty">
                No resources match these filters.
                <span className="rl-filter-empty--sub">Clear filters or broaden your search to see more results.</span>
              </div>
            ) : (
              filteredResourcesList.map((r) => (
              <article className="rl-card" key={r.id}>
                <div className="rl-cover-wrap">
                  {r.moduleImageUrl ? (
                    <img src={resolveAssetUrl(r.moduleImageUrl)} alt={r.moduleName} className="rl-cover-image" />
                  ) : (
                    <div className="rl-cover" />
                  )}
                  {renderResourceCoverOpenControl(r)}
                  <span className={`rl-type-badge type-${String(r.type || 'NOTES').toLowerCase()}`}>{r.type}</span>
                  {(isAdmin || canManageResource(r) || isCollaborativeNoteResource(r)) ? (
                    <div className="rl-card-admin-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="rl-card-icon-btn" title="Edit resource" aria-label="Edit resource" onClick={() => openEditResourceModal(r)}>
                        <EditOutlined />
                      </button>
                      {(isAdmin || canManageResource(r)) ? (
                        <button type="button" className="rl-card-icon-btn rl-card-icon-btn-danger" title="Delete resource" aria-label="Delete resource" onClick={() => confirmDeleteResource(r)}>
                          <DeleteOutlined />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="rl-content">
                  <div className="tile-card-head">
                    <div className="tile-card-head-main">
                      <div className="tile-programme">{r.programmeName ? String(r.programmeName).toUpperCase() : '—'}</div>
                      <div className="tile-module">Module: {r.moduleName || '—'}</div>
                    </div>
                    <div className="tile-side-meta">
                      <div className="tile-rating">{stars(r.rating || 0)}</div>
                      <span className={`tile-difficulty ${String(r.difficulty || 'Medium').toLowerCase()}`}>{r.difficulty || 'Medium'}</span>
                    </div>
                  </div>
                  <h4 className="tile-title-link" onClick={() => openResourceFromTile(r)}>{r.title}</h4>
                  <p className="tile-desc">{r.description}</p>
                  <div className="tile-divider" />
                  <div className="tile-meta">
                    <span>{formatSizeKB(r.fileSize)}</span>
                    <span><EyeOutlined /> {Number(r.views) || 0}</span>
                    <span><DownloadOutlined /> {r.downloads || 0}</span>
                    <span className="tile-meta-open-slot" aria-hidden="true" />
                  </div>
                  <div className="tile-footer">
                    <div className="tile-footer-author">
                      <span className="tile-avatar">{(r.authorName || 'U').charAt(0)}</span>
                      <span className="tile-author">{r.authorName || '—'}</span>
                    </div>
                    <span className="tile-tag-badge">{(r.tags && r.tags[0]) ? r.tags[0] : '—'}</span>
                  </div>
                </div>
              </article>
            ))
            )}
          </section>
          </>
        )}

        {activePage === 'flashcards' && (
          <FlashcardsPage resources={resources} />
        )}

        {activePage === 'notes' && (
          <div className="notes-collab-wrap">
            {!selectedNoteId ? (
              <div className="notes-gallery-wrap">
                <div className="notes-collab-left-head">
                  <h3>Collaborative Notes</h3>
                  <Button type="primary" className="rl-new-note-btn" onClick={() => setOpenNewNoteModal(true)}>
                    New Note
                  </Button>
                </div>
                <LibraryAdvancedFilters
                  variant="notes"
                  filters={noteFilters}
                  onChange={setNoteFilters}
                  onClear={() => setNoteFilters({ ...defaultNoteFilters })}
                  programmeOptions={programmeFilterOptions}
                  moduleOptions={moduleOptionsNotes}
                />
                <div className="notes-gallery-grid">
                  {filteredNotesList.length === 0 ? (
                    <div className="rl-filter-empty">
                      No notes match these filters.
                      <span className="rl-filter-empty--sub">Clear filters or adjust programme / module to see more collaborative notes.</span>
                    </div>
                  ) : (
                    filteredNotesList.map((n) => (
                      <article
                        role="button"
                        tabIndex={0}
                        key={n.id}
                        className="note-tile rl-card rl-card--no-cover"
                        onClick={() => openCollaborativeNoteDetails(n)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openCollaborativeNoteDetails(n);
                          }
                        }}
                      >
                        <div className="note-card-top">
                          <span className={`rl-type-badge type-${String(n.type || 'NOTES').toLowerCase()}`}>{n.type || 'NOTES'}</span>
                          {(isAdmin || canManageResource(n) || isCollaborativeNoteResource(n)) ? (
                            <div className="note-card-top-actions" onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="rl-card-icon-btn" title="Edit resource" aria-label="Edit resource" onClick={() => openEditResourceModal(n)}>
                                <EditOutlined />
                              </button>
                              {(isAdmin || canManageResource(n)) ? (
                                <button type="button" className="rl-card-icon-btn rl-card-icon-btn-danger" title="Delete resource" aria-label="Delete resource" onClick={() => confirmDeleteResource(n)}>
                                  <DeleteOutlined />
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="rl-content note-content">
                          <div className="tile-card-head">
                            <div className="tile-card-head-main">
                              <div className="tile-programme">{n.programmeName ? String(n.programmeName).toUpperCase() : '—'}</div>
                              <div className="tile-module">Module: {n.moduleName || '—'}</div>
                            </div>
                            <div className="tile-side-meta">
                              <div className="tile-rating">{stars(n.rating || 0)}</div>
                              <span className={`tile-difficulty ${String(n.difficulty || 'Medium').toLowerCase()}`}>{n.difficulty || 'Medium'}</span>
                            </div>
                          </div>
                          <h4 className="tile-title-link" onClick={(e) => { e.stopPropagation(); openCollaborativeNoteDetails(n); }}>{n.title}</h4>
                          <p className="tile-desc">{n.description || ''}</p>
                          <div className="tile-divider" />
                          <div className="tile-meta">
                            <span>{formatSizeKB(n.fileSize)}</span>
                            <span><EyeOutlined /> {Number(n.views) || 0}</span>
                            <span><DownloadOutlined /> {n.downloads || 0}</span>
                          </div>
                          <div className="tile-footer">
                            <div className="tile-footer-author">
                              <span className="tile-avatar">{(n.authorName || 'U').charAt(0)}</span>
                              <span className="tile-author">{n.authorName || '—'}</span>
                            </div>
                            <span className="tile-tag-badge">
                              {(n.tags && n.tags[0]) ? String(n.tags[0]) : '—'}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="notes-collab-main">
                <Card className="notes-editor-card">
                  <div className="notes-editor-top">
                    <Button className="notes-back-btn" onClick={() => setSelectedNoteId(null)}>Back to Notes</Button>
                    <Input
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note title"
                      readOnly={!canEditCollaborativeNoteContentById(selectedNoteId)}
                    />
                    {selectedNoteId && canManageResourceById(selectedNoteId) ? (
                      <Button danger onClick={() => deleteCollaborativeNote(selectedNoteId)}>Delete Note</Button>
                    ) : null}
                    {canEditCollaborativeNoteContentById(selectedNoteId) ? (
                      <Button type="primary" loading={noteSaving} onClick={saveCollaborativeNote}>Save Changes</Button>
                    ) : null}
                  </div>
                  <Input
                    value={noteDescription}
                    onChange={(e) => setNoteDescription(e.target.value)}
                    placeholder="Short description"
                    style={{ marginTop: 10 }}
                    readOnly={!canEditCollaborativeNoteContentById(selectedNoteId)}
                  />
                  <div className="word-toolbar">
                    {canEditCollaborativeNoteContentById(selectedNoteId) ? (
                      <>
                        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageInsert} />
                        <div className="word-toolbar-group">
                          <select defaultValue="Inter" onChange={(e) => applyWordFormat('fontName', e.target.value)}>
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Calibri">Calibri</option>
                            <option value="Georgia">Georgia</option>
                          </select>
                          <select defaultValue="3" onChange={(e) => applyWordFormat('fontSize', e.target.value)}>
                            <option value="1">10</option>
                            <option value="2">12</option>
                            <option value="3">14</option>
                            <option value="4">18</option>
                            <option value="5">24</option>
                            <option value="6">32</option>
                          </select>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={() => applyWordFormat('bold')}><BoldOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('italic')}><ItalicOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('underline')}><UnderlineOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('strikeThrough')}><StrikethroughOutlined /></button>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={() => applyWordFormat('justifyLeft')}><AlignLeftOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('justifyCenter')}><AlignCenterOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('justifyRight')}><AlignRightOutlined /></button>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={() => applyWordFormat('insertUnorderedList')}><UnorderedListOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('insertOrderedList')}><OrderedListOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('outdent')}>Outdent</button>
                          <button type="button" onClick={() => applyWordFormat('indent')}>Indent</button>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={() => applyWordFormat('formatBlock', 'H1')}>H1</button>
                          <button type="button" onClick={() => applyWordFormat('formatBlock', 'H2')}>H2</button>
                          <button type="button" onClick={() => applyWordFormat('formatBlock', 'P')}>P</button>
                        </div>
                        <div className="word-toolbar-group">
                          <label className="tiny-label">Text</label>
                          <input type="color" onChange={(e) => applyWordFormat('foreColor', e.target.value)} />
                          <label className="tiny-label">Highlight</label>
                          <input type="color" onChange={(e) => applyWordFormat('hiliteColor', e.target.value)} />
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={insertLink}><LinkOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('unlink')}><DisconnectOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('insertHorizontalRule')}>HR</button>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={insertTable}><TableOutlined /></button>
                          <button type="button" onClick={triggerImageInsert}><FileImageOutlined /></button>
                        </div>
                        <div className="word-toolbar-group">
                          <button type="button" onClick={() => applyWordFormat('undo')}><UndoOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('redo')}><RedoOutlined /></button>
                          <button type="button" onClick={() => applyWordFormat('removeFormat')}>Clear</button>
                        </div>
                      </>
                    ) : null}
                    <div className="word-toolbar-group">
                      <button type="button" onClick={() => openPrintWindow(false)}><PrinterOutlined /></button>
                      <button type="button" onClick={() => openPrintWindow(true)}><FilePdfOutlined /></button>
                    </div>
                  </div>
                  <div className="word-editor-shell">
                    <div
                      ref={noteEditorRef}
                      className="word-editor-area"
                      contentEditable={!noteLoading && canEditCollaborativeNoteContentById(selectedNoteId)}
                      suppressContentEditableWarning
                      onInput={(e) => setNoteContent(e.currentTarget.innerHTML)}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {activePage === 'requests' && (
          <div className="rl-requests-page">
            <header className="rl-requests-page__head">
              <div className="rl-requests-page__head-text">
                <h2 className="rl-requests-page__title">Requests</h2>
                {!isAdmin ? (
                  <p className="rl-requests-page__subtitle">
                    Submit a request about missing resources, incorrect content, or access issues.
                  </p>
                ) : null}
              </div>
              {!isAdmin ? (
                <Button type="primary" className="rl-requests-create-btn" onClick={() => setOpenRequest(true)}>
                  Create request
                </Button>
              ) : null}
            </header>

            {!requests.length ? (
              <div className="rl-requests-empty">
                <FileTextOutlined className="rl-requests-empty__icon" aria-hidden />
                <p className="rl-requests-empty__title">No requests yet</p>
                <p className="rl-requests-empty__hint">
                  {isAdmin ? 'When students submit requests, they will appear here.' : 'Create a request to get help from the resource team.'}
                </p>
              </div>
            ) : (
              <ul className="rl-requests-list" aria-label="Resource requests">
                {requests.map((r) => {
                  const reqStatusKey = String(r.status || 'in_progress').replace('_', '-');
                  const created = r.createdAt || r.created_at;
                  return (
                  <li key={r.id}>
                    <Card className={`rl-request-card rl-request-card--${reqStatusKey}`} bordered={false}>
                      <div className="rl-request-card__head">
                        <div className="rl-request-card__icon-badge" aria-hidden>
                          <FileTextOutlined />
                        </div>
                        <div className="rl-request-card__head-main">
                          <div className="rl-request-card__top">
                            <h3 className="rl-request-card__title">{r.title}</h3>
                            <span className={`rl-request-card__status rl-request-card__status--${reqStatusKey}`}>
                              {r.status === 'resolved' ? (
                                <>
                                  <CheckCircleOutlined aria-hidden />
                                  Resolved
                                </>
                              ) : (
                                <>
                                  <ClockCircleOutlined aria-hidden />
                                  In progress
                                </>
                              )}
                            </span>
                          </div>
                          {created ? (
                            <div className="rl-request-card__date">
                              <CalendarOutlined aria-hidden />
                              <time dateTime={typeof created === 'string' ? created : new Date(created).toISOString()}>
                                {new Date(created).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </time>
                              <span className="rl-request-card__date-sep" aria-hidden>
                                ·
                              </span>
                              {new Date(created).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="rl-request-card__body-wrap">
                        <p className="rl-request-card__body">{r.description || r.details}</p>
                      </div>
                      <div className="rl-request-card__chips">
                        <span className="rl-request-chip rl-request-chip--user">
                          <UserOutlined aria-hidden />
                          {r.requestedBy}
                        </span>
                        {r.programmeName ? (
                          <span className="rl-request-chip rl-request-chip--programme">
                            <BankOutlined aria-hidden />
                            {r.programmeName}
                          </span>
                        ) : null}
                        {r.moduleName ? (
                          <span className="rl-request-chip rl-request-chip--module">
                            <FolderOpenOutlined aria-hidden />
                            {r.moduleName}
                          </span>
                        ) : null}
                      </div>
                      <div className="rl-request-card__footer">
                        <div className="rl-request-card__evidence">
                          {r.attachmentUrl ? (
                            <a
                              className="rl-request-evidence-pill rl-request-evidence-pill--link"
                              href={resolveAssetUrl(r.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="rl-request-evidence-pill__icon" aria-hidden>
                                <PaperClipOutlined />
                              </span>
                              <span className="rl-request-evidence-pill__text">
                                <span className="rl-request-evidence-pill__label">Evidence</span>
                                <span className="rl-request-evidence-pill__name">{r.attachmentName || 'View file'}</span>
                              </span>
                            </a>
                          ) : (
                            <span className="rl-request-evidence-pill rl-request-evidence-pill--empty">
                              <PaperClipOutlined aria-hidden />
                              <span>No attachment</span>
                            </span>
                          )}
                        </div>
                        <div className="rl-request-card__actions">
                          {!isAdmin ? (
                            <Select
                              size="small"
                              className="rl-request-status-select"
                              value={r.status}
                              options={[
                                { label: 'In progress', value: 'in_progress' },
                                { label: 'Resolved', value: 'resolved' }
                              ]}
                              onChange={(value) => changeRequestStatus(r.id, value)}
                              getPopupContainer={(n) => n?.parentElement || document.body}
                            />
                          ) : null}
                          <Button type="primary" className="rl-request-chat-btn" icon={<MessageOutlined />} onClick={() => openChat(r)}>
                            Open chat
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activePage === 'resource-details' && (
          <div className="resource-detail-page">
            <div className="resource-detail-back-row">
              <Button type="text" icon={<ArrowLeftOutlined />} onClick={goBackFromResourceDetails} className="resource-detail-back-btn">
                Back
              </Button>
            </div>
            {detailsLoading || !resourceDetails ? (
              <Card>Loading resource details...</Card>
            ) : (
              <>
                <Card className="resource-detail-top">
                  <div className="resource-detail-head">
                    <h2>{resourceDetails.title}</h2>
                    <span className="resource-detail-module-pill">{resourceDetails.moduleName || 'Module'}</span>
                  </div>
                  <p>{resourceDetails.description}</p>
                  <div className="resource-detail-stats">
                    <div className="resource-detail-stats-inner">
                      <div className="resource-detail-stats-main">
                        <span className="resource-stat-inline" title={`Downloads: ${resourceDetails.downloads}`} aria-label={`Downloads: ${resourceDetails.downloads}`}>
                          <DownloadOutlined className="resource-stat-icon" aria-hidden />
                          <strong>{resourceDetails.downloads}</strong>
                        </span>
                        <span className="resource-stat-sep" aria-hidden />
                        <span className="resource-stat-inline" title={`Views: ${resourceDetails.views}`} aria-label={`Views: ${resourceDetails.views}`}>
                          <EyeOutlined className="resource-stat-icon" aria-hidden />
                          <strong>{resourceDetails.views}</strong>
                        </span>
                        <span className="resource-stat-sep" aria-hidden />
                        <span className="resource-stat-inline resource-stat-inline--labeled">
                          <small>Uploaded By</small>
                          <strong>{resourceDetails.uploadedBy}</strong>
                        </span>
                        <span className="resource-stat-sep" aria-hidden />
                        <span className="resource-stat-inline resource-stat-inline--labeled">
                          <small>Uploaded Date</small>
                          <strong>{new Date(resourceDetails.uploadedAt).toLocaleDateString()}</strong>
                        </span>
                      </div>
                      <div className="resource-detail-stats-pills">
                        <div className="resource-stat-pill" role="group" aria-label="Average difficulty">
                          <small>Average Difficulty</small>
                          <span className={`details-difficulty-badge details-difficulty-badge--pill ${String(resourceDetails.difficulty || 'Medium').toLowerCase()}`}>
                            {resourceDetails.difficulty}
                          </span>
                        </div>
                        <div className="resource-stat-pill" role="group" aria-label="Average rating">
                          <small>Average Rating</small>
                          <div className="resource-stat-pill-rating">
                            <span className="details-rating-stars details-rating-stars--pill">
                              {renderAverageStars(resourceDetails.averageRating || resourceDetails.rating)}
                            </span>
                            <span className="details-rating-number details-rating-number--pill">
                              {resourceDetails.averageRating || resourceDetails.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div
                  className={`resource-detail-main${
                    resourceDetailsIsCollaborativeNote ? ' resource-detail-main--collab-note' : ''
                  }`}
                >
                  <Card
                    className={
                      resourceDetailsIsCollaborativeNote ? 'resource-collab-note-card' : 'resource-preview-card'
                    }
                  >
                    {!resourceDetailsIsCollaborativeNote ? (
                      <div className="detail-section-title detail-section-title-with-yt">
                        <span>Preview of the Document</span>
                        {isVideoResource(resourceDetails) && resourceDetails.fileUrl ? (
                          <YouTubeVideoLink href={resolveAssetUrl(resourceDetails.fileUrl)} className="rl-youtube-link-inline" />
                        ) : null}
                      </div>
                    ) : null}
                    {resourceDetailsIsCollaborativeNote ? (
                      <div className="notes-collab-main resource-collab-note-workspace">
                        <div className="notes-editor-card">
                          <div className="word-toolbar word-toolbar--resource-collab">
                            {canEditCollaborativeNoteContentById(selectedNoteId) ? (
                              <>
                                <input
                                  ref={imageInputRef}
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={handleImageInsert}
                                />
                                <div className="word-toolbar-group">
                                  <select defaultValue="Inter" onChange={(e) => applyWordFormat('fontName', e.target.value)}>
                                    <option value="Inter">Inter</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                    <option value="Calibri">Calibri</option>
                                    <option value="Georgia">Georgia</option>
                                  </select>
                                  <select defaultValue="3" onChange={(e) => applyWordFormat('fontSize', e.target.value)}>
                                    <option value="1">10</option>
                                    <option value="2">12</option>
                                    <option value="3">14</option>
                                    <option value="4">18</option>
                                    <option value="5">24</option>
                                    <option value="6">32</option>
                                  </select>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={() => applyWordFormat('bold')}><BoldOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('italic')}><ItalicOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('underline')}><UnderlineOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('strikeThrough')}><StrikethroughOutlined /></button>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={() => applyWordFormat('justifyLeft')}><AlignLeftOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('justifyCenter')}><AlignCenterOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('justifyRight')}><AlignRightOutlined /></button>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={() => applyWordFormat('insertUnorderedList')}><UnorderedListOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('insertOrderedList')}><OrderedListOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('outdent')}>Outdent</button>
                                  <button type="button" onClick={() => applyWordFormat('indent')}>Indent</button>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={() => applyWordFormat('formatBlock', 'H1')}>H1</button>
                                  <button type="button" onClick={() => applyWordFormat('formatBlock', 'H2')}>H2</button>
                                  <button type="button" onClick={() => applyWordFormat('formatBlock', 'P')}>P</button>
                                </div>

                                <div className="word-toolbar-group">
                                  <label className="tiny-label">Text</label>
                                  <input type="color" onChange={(e) => applyWordFormat('foreColor', e.target.value)} />
                                  <label className="tiny-label">Highlight</label>
                                  <input type="color" onChange={(e) => applyWordFormat('hiliteColor', e.target.value)} />
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={insertLink}><LinkOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('unlink')}><DisconnectOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('insertHorizontalRule')}>HR</button>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={insertTable}><TableOutlined /></button>
                                  <button type="button" onClick={triggerImageInsert}><FileImageOutlined /></button>
                                </div>

                                <div className="word-toolbar-group">
                                  <button type="button" onClick={() => applyWordFormat('undo')}><UndoOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('redo')}><RedoOutlined /></button>
                                  <button type="button" onClick={() => applyWordFormat('removeFormat')}>Clear</button>
                                </div>
                              </>
                            ) : null}
                            <div className="word-toolbar-group">
                              <button type="button" onClick={() => openPrintWindow(false)}><PrinterOutlined /></button>
                              <button type="button" onClick={() => openPrintWindow(true)}><FilePdfOutlined /></button>
                            </div>
                          </div>

                          <div className="word-editor-shell resource-collab-editor-shell">
                            {noteLoading ? (
                              <div className="resource-collab-note-loading-overlay">
                                <Spin size="large" tip="Loading note…" />
                              </div>
                            ) : null}
                            <div
                              ref={noteEditorRef}
                              className={`word-editor-area${noteLoading ? ' word-editor-area--loading' : ''}`}
                              contentEditable={!noteLoading && canEditCollaborativeNoteContentById(selectedNoteId)}
                              suppressContentEditableWarning
                              onInput={(e) => setNoteContent(e.currentTarget.innerHTML)}
                            />
                          </div>

                          <div className="resource-collab-note-footer-actions">
                            {selectedNoteId && canManageResourceById(selectedNoteId) ? (
                              <Button danger onClick={() => deleteCollaborativeNote(selectedNoteId)}>Delete Note</Button>
                            ) : null}
                            {canEditCollaborativeNoteContentById(selectedNoteId) ? (
                              <Button type="primary" loading={noteSaving} onClick={saveCollaborativeNote}>
                                Save Changes
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const previewSrc = resolveAssetUrl(resourceDetails.fileUrl);
                        const youtubeEmbed = getYouTubeEmbedUrl(previewSrc);
                        if (resourceDetails.fileMime?.includes('pdf')) {
                          return <iframe src={previewSrc} title="resource-preview" className="resource-preview-frame" />;
                        }
                        if (youtubeEmbed) {
                          return (
                            <iframe
                              src={youtubeEmbed}
                              title="YouTube preview"
                              className="resource-preview-frame resource-preview-youtube"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          );
                        }
                        if (resourceDetails.fileMime?.startsWith('video')) {
                          return <video src={previewSrc} controls className="resource-preview-video" />;
                        }
                        return (
                          <div className="resource-preview-generic">
                            <p>Preview not available for this file type.</p>
                            {resourceDetails.fileUrl ? <a href={previewSrc} target="_blank" rel="noreferrer">Open file</a> : null}
                          </div>
                        );
                      })()
                    )}
                  </Card>

                  <Card className="resource-rating-card">
                    <h3>Rate This Resource</h3>
                    <div className="rating-widget-head">
                      <div>
                        <div className="rating-score">{resourceDetails.averageRating || resourceDetails.rating} <span>/ 5</span></div>
                        <div className="rating-count">{resourceDetails.ratingsCount || 0} ratings</div>
                      </div>
                      <span className={`tile-difficulty ${String(resourceDetails.difficulty || 'Medium').toLowerCase()}`}>{resourceDetails.difficulty || 'Medium'}</span>
                    </div>
                    <div className="rating-row">
                      <label>Your Star Rating</label>
                      <Rate
                        value={myStars}
                        onChange={setMyStars}
                        className="fancy-star-rate"
                      />
                      <div className="rating-note">{myStars ? `${myStars} of 5 stars` : 'Tap to rate'}</div>
                    </div>
                    <div className="rating-row">
                      <label>Your Difficulty Rating</label>
                      <div className="difficulty-chips">
                        {['Easy', 'Medium', 'Hard'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            className={`difficulty-chip ${level.toLowerCase()} ${myDifficulty === level ? 'selected' : ''}`}
                            onClick={() => setMyDifficulty(level)}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button type="primary" onClick={submitMyRating} loading={ratingSubmitting} block style={{ marginTop: 10 }}>Submit Rating</Button>
                    <Button className="animated-download-btn" onClick={handleDownload} block style={{ marginTop: 14 }}>
                      Download
                    </Button>
                    <div className="whiteboard-section">
                      <div className="whiteboard-section-label">Study Tools</div>
                      <Button className="whiteboard-btn" onClick={() => setOpenWhiteboard(true)} block>
                        Open Whiteboard
                      </Button>
                    </div>
                  </Card>
                </div>

                <Card className="resource-comments-card">
                  <div className="detail-section-title">Comments & Replies</div>
                  <div className="comment-input-row">
                    <textarea
                      className="comment-editor-textarea"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                    />
                    <Button type="primary" loading={commentSubmitting} onClick={() => submitComment(null)}>Comment</Button>
                  </div>
                  <div className="comment-list">
                    {resourceDetails.comments?.length ? resourceDetails.comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-main-row">
                          <div className="comment-avatar">{String(c.authorName || 'U').charAt(0).toUpperCase()}</div>
                          <div className="comment-body">
                            <div className="comment-meta-line">
                              <div className="comment-author">{c.authorName}</div>
                              <div className="comment-time">{formatCommentDate(c.createdAt)}</div>
                            </div>
                            <div className="comment-text">{c.text}</div>
                            <button type="button" className="comment-reply-link" onClick={() => setActiveReplyId(c.id)}>
                              <EditOutlined /> Reply
                            </button>
                          </div>
                        </div>
                        {activeReplyId === c.id ? (
                          <div className="reply-input-row">
                            <Input
                              autoFocus
                              value={replyTextByComment[c.id] || ''}
                              onChange={(e) => setReplyTextByComment((prev) => ({ ...prev, [c.id]: e.target.value }))}
                              placeholder="Write a reply..."
                            />
                            <Button loading={replySubmittingId === c.id} onClick={() => submitComment(c.id)}>Reply</Button>
                          </div>
                        ) : null}
                        {c.replies?.map((r) => (
                          <div key={r.id} className="reply-item">
                            <div className="comment-main-row">
                              <div className="comment-avatar reply-avatar">{String(r.authorName || 'U').charAt(0).toUpperCase()}</div>
                              <div className="comment-body">
                                <div className="comment-meta-line">
                                  <div className="comment-author">{r.authorName}</div>
                                  <div className="comment-time">{formatCommentDate(r.createdAt)}</div>
                                </div>
                                <div className="comment-text">{r.text}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )) : (
                      <div className="comments-empty">No comments yet. Be the first to comment.</div>
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        <Modal title="Upload Resource" className="upload-resource-modal" open={openUpload} onCancel={() => setOpenUpload(false)} footer={null}>
          <Form form={uploadForm} layout="vertical" onFinish={createResource}>
            <div className="upload-kind-grid">
              <button type="button" className={`upload-kind-card ${uploadKind === 'file' ? 'active' : ''}`} onClick={() => setUploadKind('file')}>
                <FileTextOutlined />
                <span>File</span>
              </button>
              <button type="button" className={`upload-kind-card ${uploadKind === 'collab' ? 'active' : ''}`} onClick={() => setUploadKind('collab')}>
                <TeamOutlined />
                <span>Collaborative Note</span>
              </button>
              <button type="button" className={`upload-kind-card ${uploadKind === 'video' ? 'active' : ''}`} onClick={() => setUploadKind('video')}>
                <VideoCameraOutlined />
                <span>Video</span>
              </button>
            </div>
            <Form.Item label="Programme" name="programmeId" rules={[{ required: true }]}>
              <Select
                placeholder="Select programme"
                options={programmes.map((p) => ({ label: p.name, value: p.id }))}
                onChange={(id) => {
                  uploadForm.setFieldsValue({ moduleId: undefined });
                  loadModules(id);
                }}
                popupRender={(menu) => (
                  <>
                    {menu}
                    {isAdmin ? (
                      <div className="upload-dropdown-admin-footer">
                        <Button
                          htmlType="button"
                          type="default"
                          size="small"
                          className="upload-dropdown-admin-btn"
                          onClick={() => {
                            setEditingProgramme(null);
                            setProgrammeEditAwaitingPick(false);
                            programmeForm.resetFields();
                            setOpenProgramme(true);
                          }}
                        >
                          + Create Programme
                        </Button>
                        <Button htmlType="button" type="default" size="small" className="upload-dropdown-admin-btn" onClick={openEditProgrammeFromUpload}>
                          Edit programme
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label="Module" name="moduleId" rules={[{ required: true }]}>
              <Select
                placeholder="Select module"
                options={modules.map((m) => ({ label: m.name, value: m.id }))}
                popupRender={(menu) => (
                  <>
                    {menu}
                    {isAdmin ? (
                      <div className="upload-dropdown-admin-footer">
                        <Button
                          htmlType="button"
                          type="default"
                          size="small"
                          className="upload-dropdown-admin-btn"
                          onClick={() => {
                            setEditingModule(null);
                            setModuleImageFile(null);
                            moduleForm.resetFields();
                            const pid = uploadForm.getFieldValue('programmeId');
                            if (pid) moduleForm.setFieldsValue({ programmeId: pid });
                            setOpenModule(true);
                          }}
                        >
                          + Create Module
                        </Button>
                        <Button htmlType="button" type="default" size="small" className="upload-dropdown-admin-btn" onClick={openEditModuleFromUpload}>
                          Edit module
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Tags (comma separated)" name="tags" extra="Example: DS, DBMS, Midterm">
              <Input placeholder="e.g. DS, DBMS, Midterm" />
            </Form.Item>
            {uploadKind === 'collab' ? (
              <Form.Item label="Collaborative Note Content" name="noteContent" rules={[{ required: true, message: 'Please enter note content.' }]}>
                <Input.TextArea rows={6} placeholder="Write the collaborative note content..." />
              </Form.Item>
            ) : uploadKind === 'video' ? (
              <Form.Item label="Video URL" name="videoUrl" rules={[{ required: true, message: 'Please enter a video URL.' }]}>
                <Input placeholder="https://..." />
              </Form.Item>
            ) : (
              <Form.Item label="Resource File" required>
                <Upload
                  beforeUpload={(file) => {
                    setResourceFile(file);
                    return false;
                  }}
                  maxCount={1}
                >
                  <Button>Select File</Button>
                </Upload>
              </Form.Item>
            )}
            <Button type="primary" htmlType="submit" block>Upload Resource</Button>
          </Form>
        </Modal>

        <Modal
          title="Edit resource"
          className="upload-resource-modal"
          open={openEditResource}
          onCancel={() => {
            setOpenEditResource(false);
            setEditingResourceId(null);
            setEditingResourceSnapshot(null);
            setEditResourceAttachmentFile(null);
            editResourceForm.resetFields();
          }}
          footer={null}
        >
          <Form form={editResourceForm} layout="vertical" onFinish={saveEditedResource}>
            <Form.Item label="Programme" name="programmeId" rules={[{ required: true }]}>
              <Select
                placeholder="Select programme"
                options={programmes.map((p) => ({ label: p.name, value: p.id }))}
                onChange={(id) => {
                  editResourceForm.setFieldsValue({ moduleId: undefined });
                  loadModules(id);
                }}
              />
            </Form.Item>
            <Form.Item label="Module" name="moduleId" rules={[{ required: true }]}>
              <Select placeholder="Select module" options={modules.map((m) => ({ label: m.name, value: m.id }))} />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Tags (comma separated)" name="tags" extra="Example: DS, DBMS, Midterm">
              <Input placeholder="e.g. DS, DBMS, Midterm" />
            </Form.Item>
            {editingResourceSnapshot ? (
              <p className="rl-edit-current-attachment">
                <strong>{editingResourceSnapshot.fileName || (isVideoResource(editingResourceSnapshot) ? 'Video' : '—')}</strong>
                {isExternalVideoUrl(editingResourceSnapshot) ? <span className="rl-edit-url-hint"> (link)</span> : null}
              </p>
            ) : null}
            {editingResourceSnapshot && isCollaborativeNoteResource(editingResourceSnapshot) ? (
              <Form.Item>
                <Button type="default" block onClick={() => goToCollaborativeNoteFromEdit()}>
                  Go to Collaborative Note
                </Button>
              </Form.Item>
            ) : null}
            {editingResourceSnapshot && !isVideoResource(editingResourceSnapshot) && !isCollaborativeNoteResource(editingResourceSnapshot) ? (
              <Form.Item label="Replace file">
                <Upload.Dragger
                  className="rl-edit-replace-dragger"
                  beforeUpload={(file) => {
                    setEditResourceAttachmentFile(file);
                    return false;
                  }}
                  maxCount={1}
                  showUploadList={false}
                  onRemove={() => setEditResourceAttachmentFile(null)}
                  fileList={editResourceAttachmentFile ? [{ uid: '-1', name: editResourceAttachmentFile.name, status: 'done' }] : []}
                >
                  <div className="rl-edit-replace-drag-content">
                    <UploadOutlined />
                    <div className="rl-edit-replace-drag-title">Attach a new file</div>
                    <div className="rl-edit-replace-drag-sub">Click or drop to browse</div>
                  </div>
                </Upload.Dragger>
                {editResourceAttachmentFile ? (
                  <div className="rl-edit-replace-selected">
                    <span className="rl-edit-replace-selected-name">{editResourceAttachmentFile.name}</span>
                    <Button size="small" onClick={() => setEditResourceAttachmentFile(null)}>Remove</Button>
                  </div>
                ) : null}
              </Form.Item>
            ) : null}
            {editingResourceSnapshot && isVideoResource(editingResourceSnapshot) ? (
              <Form.Item label="Video URL" name="replaceVideoUrl">
                <Input placeholder="https://..." />
              </Form.Item>
            ) : null}
            <Button type="primary" htmlType="submit" block>Save changes</Button>
          </Form>
        </Modal>

        <Modal
          title="New Request"
          open={openRequest}
          onCancel={() => setOpenRequest(false)}
          footer={null}
          wrapClassName="rl-light-modal"
          destroyOnHidden
        >
          <Form form={requestForm} layout="vertical" onFinish={createRequest}>
            <Form.Item label="Programme" name="programmeId" rules={[{ required: true, message: 'Please select programme' }]}>
              <Select
                placeholder="Select programme"
                options={programmes.map((p) => ({ label: p.name, value: p.id }))}
                onChange={(id) => {
                  const selected = programmes.find((p) => p.id === id);
                  requestForm.setFieldsValue({ programmeName: selected?.name || '', moduleId: undefined, moduleName: undefined });
                  loadModules(id);
                }}
              />
            </Form.Item>
            <Form.Item name="programmeName" hidden><Input /></Form.Item>
            <Form.Item label="Module (optional)" name="moduleId">
              <Select
                placeholder="Select module"
                allowClear
                options={modules.map((m) => ({ label: m.name, value: m.id }))}
                onChange={(id) => {
                  const selected = modules.find((m) => m.id === id);
                  requestForm.setFieldsValue({ moduleName: selected?.name || '' });
                }}
              />
            </Form.Item>
            <Form.Item name="moduleName" hidden><Input /></Form.Item>
            <Form.Item label="Category" name="category" initialValue="Resource Missing">
              <Select options={['Resource Missing', 'Wrong Content', 'Access Issue', 'Suggestion', 'Other'].map((c) => ({ label: c, value: c }))} />
            </Form.Item>
            <Form.Item label="Priority" name="priority" initialValue="Medium">
              <Select options={['Low', 'Medium', 'High'].map((p) => ({ label: p, value: p }))} />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
            <Form.Item label="Attach Evidence (optional)">
              <Upload beforeUpload={(file) => { setRequestEvidenceFile(file); return false; }} maxCount={1}>
                <Button>Select Evidence</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Submit</Button>
          </Form>
        </Modal>
        <Modal
          title={null}
          open={openRequestChat}
          onCancel={() => {
            setOpenRequestChat(false);
            setRequestEditMessageId(null);
            setRequestEditText('');
            setRequestChatFile(null);
            if (requestChatFileInputRef.current) requestChatFileInputRef.current.value = '';
          }}
          footer={null}
          closable={false}
          width="min(760px, calc(100vw - 48px))"
          wrapClassName="rl-light-modal rl-wa-chat-modal"
          styles={{ body: { padding: 0 }, mask: { background: 'rgba(2, 6, 23, 0.55)' } }}
          destroyOnHidden
          centered
        >
          <div className="rl-wa-shell">
            <header className="rl-wa-header">
              <button
                type="button"
                className="rl-wa-header-close"
                aria-label="Close chat"
                onClick={() => {
                  setOpenRequestChat(false);
                  setRequestEditMessageId(null);
                  setRequestEditText('');
                  setRequestChatFile(null);
                  if (requestChatFileInputRef.current) requestChatFileInputRef.current.value = '';
                }}
              >
                <CloseOutlined />
              </button>
              <div className="rl-wa-header-main">
                <div className="rl-wa-header-avatar-wrap" aria-hidden>
                  <div className="rl-wa-header-avatar">
                    <MessageOutlined />
                  </div>
                </div>
                <div className="rl-wa-header-text">
                  <div className="rl-wa-header-title">{activeRequest?.title || 'Request'}</div>
                  <div className="rl-wa-header-sub">
                    <span className="rl-wa-header-live">
                      <span className="rl-wa-header-live-dot" aria-hidden />
                      Active thread
                    </span>
                    <span className="rl-wa-header-sub-sep" aria-hidden>
                      ·
                    </span>
                    <span>Replies sync every few seconds</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="rl-wa-messages" ref={requestChatScrollRef}>
              <div className="rl-wa-messages-inner">
              {!requestMessages.length ? (
                <div className="rl-wa-empty">
                  <div className="rl-wa-empty__visual" aria-hidden>
                    <MessageOutlined className="rl-wa-empty__icon" />
                  </div>
                  <p>No messages yet</p>
                  <span>Send a message to start chatting with the resource team.</span>
                </div>
              ) : (
                requestMessages.map((m) => {
                  const fromAdmin = m.senderRole === 'admin';
                  const mine =
                    m.senderName === requestChatSenderName &&
                    m.senderRole === (isAdmin ? 'admin' : 'student');
                  const created = m.createdAt || m.created_at;
                  const updated = m.updatedAt || m.updated_at;
                  const showEdited =
                    created &&
                    updated &&
                    new Date(updated).getTime() > new Date(created).getTime() + 800;
                  const timeLabel = created
                    ? new Date(created).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                    : '';
                  const isEditing = requestEditMessageId === m.id;
                  const attachmentOnly =
                    !!(m.attachmentUrl && m.message && String(m.message).trim().startsWith('📎'));

                  return (
                    <div
                      key={m.id}
                      className={`rl-wa-row${mine ? ' rl-wa-row--mine' : ' rl-wa-row--theirs'}`}
                    >
                      <div
                        className={`rl-wa-bubble${mine ? ' rl-wa-bubble--mine' : ' rl-wa-bubble--theirs'}${
                          fromAdmin && !mine ? ' rl-wa-bubble--staff' : ''
                        }`}
                      >
                        <div className={`rl-wa-bubble__sender${mine ? ' rl-wa-bubble__sender--mine' : ''}`}>
                          <span
                            className={`rl-wa-msg-avatar${fromAdmin ? ' rl-wa-msg-avatar--admin' : ''}`}
                            aria-hidden
                          >
                            {(m.senderName || '?').trim().charAt(0).toUpperCase() || '?'}
                          </span>
                          <span className="rl-wa-bubble__sender-name">{m.senderName}</span>
                          <span className="rl-wa-bubble__badge">
                            {mine ? 'You' : fromAdmin ? 'Resource team' : 'Student'}
                          </span>
                        </div>

                        {isEditing ? (
                          <div className="rl-wa-edit">
                            <Input.TextArea
                              className="rl-wa-edit-input"
                              rows={3}
                              value={requestEditText}
                              onChange={(e) => setRequestEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setRequestEditMessageId(null);
                                  setRequestEditText('');
                                }
                              }}
                            />
                            <div className="rl-wa-edit-actions">
                              <Button size="small" onClick={() => { setRequestEditMessageId(null); setRequestEditText(''); }}>
                                Cancel
                              </Button>
                              <Button size="small" type="primary" onClick={saveRequestMessageEdit}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {!attachmentOnly && m.message ? (
                              <div className="rl-wa-bubble__text">{m.message}</div>
                            ) : null}
                            {m.attachmentUrl ? (
                              <a
                                className="rl-wa-attach-link"
                                href={resolveAssetUrl(m.attachmentUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <PaperClipOutlined className="rl-wa-attach-link__icon" aria-hidden />
                                <span className="rl-wa-attach-link__name">{m.attachmentName || 'Attachment'}</span>
                                <span className="rl-wa-attach-link__hint">Open</span>
                              </a>
                            ) : null}
                            <div className="rl-wa-bubble__meta">
                              <span className="rl-wa-bubble__time">{timeLabel}</span>
                              {showEdited ? <span className="rl-wa-bubble__edited">Edited</span> : null}
                            </div>
                          </>
                        )}

                        {mine && !isEditing ? (
                          <div className="rl-wa-bubble__toolbar">
                            <button
                              type="button"
                              className="rl-wa-bubble__tool"
                              aria-label="Edit message"
                              onClick={() => {
                                setRequestEditMessageId(m.id);
                                setRequestEditText(m.message || '');
                              }}
                            >
                              <EditOutlined />
                            </button>
                            <Popconfirm
                              title="Delete this message?"
                              description="This cannot be undone."
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                              onConfirm={() => removeRequestMessage(m.id)}
                            >
                              <button type="button" className="rl-wa-bubble__tool rl-wa-bubble__tool--danger" aria-label="Delete message">
                                <DeleteOutlined />
                              </button>
                            </Popconfirm>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>

            <footer className="rl-wa-footer">
              <input
                ref={requestChatFileInputRef}
                type="file"
                className="rl-wa-file-input"
                tabIndex={-1}
                onChange={(e) => setRequestChatFile(e.target.files?.[0] || null)}
              />
              <div className="rl-wa-footer-inner">
                {requestChatFile ? (
                  <div className="rl-wa-file-pill">
                    <PaperClipOutlined aria-hidden />
                    <span className="rl-wa-file-pill__name">{requestChatFile.name}</span>
                    <button
                      type="button"
                      className="rl-wa-file-pill__clear"
                      aria-label="Remove attachment"
                      onClick={() => {
                        setRequestChatFile(null);
                        if (requestChatFileInputRef.current) requestChatFileInputRef.current.value = '';
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null}
                <div className="rl-wa-footer-row">
                  <button
                    type="button"
                    className="rl-wa-attach-trigger"
                    aria-label="Attach a file"
                    onClick={() => requestChatFileInputRef.current?.click()}
                  >
                    <PaperClipOutlined />
                  </button>
                  <Input.TextArea
                    className="rl-wa-footer-input"
                    placeholder="Message or attach a file…"
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    value={requestMessageText}
                    onChange={(e) => setRequestMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendRequestMessage();
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    className="rl-wa-send-btn"
                    icon={<SendOutlined />}
                    aria-label="Send message"
                    onClick={sendRequestMessage}
                  />
                </div>
              </div>
            </footer>
          </div>
        </Modal>

        <Modal
          className="upload-resource-modal programme-edit-modal"
          title={
            programmeEditAwaitingPick && !editingProgramme
              ? 'Edit Programme'
              : editingProgramme
                ? 'Edit Programme'
                : 'Create Programme'
          }
          open={openProgramme}
          onCancel={() => {
            setOpenProgramme(false);
            setEditingProgramme(null);
            setProgrammeEditAwaitingPick(false);
            programmeForm.resetFields();
            setProgrammeEditModules([]);
          }}
          footer={null}
        >
          {programmeEditAwaitingPick && !editingProgramme ? (
            <div className="programme-edit-pick-wrap">
              <div className="programme-edit-pick-label">Choose programme to edit</div>
              <Select
                placeholder="Select programme"
                className="programme-edit-pick-select"
                options={programmes.map((p) => ({ label: p.name, value: p.id }))}
                onChange={(id) => {
                  const p = programmes.find((x) => x.id === id);
                  if (!p) return;
                  setEditingProgramme(p);
                  programmeForm.setFieldsValue({ name: p.name });
                  setProgrammeEditAwaitingPick(false);
                }}
              />
            </div>
          ) : null}
          {(!programmeEditAwaitingPick || editingProgramme) ? (
            <>
              <Form form={programmeForm} layout="vertical" onFinish={saveProgramme}>
                <Form.Item label="Programme Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
                <Button type="primary" htmlType="submit" block>{editingProgramme ? 'Save Changes' : 'Create Programme'}</Button>
              </Form>
              {isAdmin && editingProgramme ? (
                <>
                  <Divider style={{ margin: '16px 0', borderColor: 'rgba(255,255,255,.14)' }} />
                  <div className="programme-edit-modules-section">
                    <div className="programme-edit-modules-title">Modules in this programme</div>
                    {programmeEditModules.length ? (
                      <ul className="programme-edit-modules-list">
                        {programmeEditModules.map((m) => (
                          <li key={m.id} className="programme-edit-modules-row">
                            <span className="programme-edit-modules-name">{m.name}</span>
                            <Button danger size="small" onClick={() => deleteModuleInProgrammeEditor(m)}>
                              Delete
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="programme-edit-modules-empty">No modules yet. Use <strong>+ Create Module</strong> in the upload form dropdown to add one.</p>
                    )}
                  </div>
                  <Button danger block style={{ marginTop: 16 }} onClick={deleteProgrammeFromEditorModal}>
                    Delete entire programme
                  </Button>
                </>
              ) : null}
            </>
          ) : null}
        </Modal>

        <Modal
          title={editingModule ? 'Edit Module' : 'Create Module'}
          open={openModule}
          onCancel={() => {
            setOpenModule(false);
            setEditingModule(null);
            setModuleImageFile(null);
            moduleForm.resetFields();
          }}
          footer={null}
          wrapClassName="rl-light-modal"
          destroyOnHidden
        >
          <Form form={moduleForm} layout="vertical" onFinish={createOrUpdateModule}>
            <Form.Item label="Programme" name="programmeId" rules={[{ required: true }]}>
              <Select options={programmes.map((p) => ({ label: p.name, value: p.id }))} />
            </Form.Item>
            <Form.Item label="Module Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Module Tile Image">
              <Upload
                beforeUpload={(file) => {
                  setModuleImageFile(file);
                  return false;
                }}
                maxCount={1}
              >
                <Button>Select Image</Button>
              </Upload>
            </Form.Item>
            <Button type="primary" htmlType="submit" block>{editingModule ? 'Save Changes' : 'Create Module'}</Button>
          </Form>
        </Modal>
        <Modal
          title="Whiteboard"
          open={openWhiteboard}
          onCancel={() => setOpenWhiteboard(false)}
          footer={null}
          width={960}
          destroyOnHidden
          wrapClassName="rl-light-modal"
        >
          <div className="whiteboard-tools">
            <div className="wb-group">
              <div className="wb-group-title">Tools</div>
              <button type="button" className={`wb-tool-btn ${tool === 'pen' ? 'active' : ''}`} onClick={() => setTool('pen')}><HighlightOutlined /> Pen</button>
              <button type="button" className={`wb-tool-btn ${tool === 'eraser' ? 'active' : ''}`} onClick={() => setTool('eraser')}><ClearOutlined /> Eraser</button>
              <button type="button" className={`wb-tool-btn ${tool === 'line' ? 'active' : ''}`} onClick={() => setTool('line')}><BorderOutlined /> Line</button>
              <button type="button" className={`wb-tool-btn ${tool === 'rect' ? 'active' : ''}`} onClick={() => setTool('rect')}><BorderOutlined /> Rect</button>
              <button type="button" className={`wb-tool-btn ${tool === 'circle' ? 'active' : ''}`} onClick={() => setTool('circle')}><RadiusUpleftOutlined /> Circle</button>
              <button type="button" className={`wb-tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')}><FontSizeOutlined /> Text</button>
            </div>
            <div className="wb-group">
              <div className="wb-group-title">Style</div>
              <label className="wb-inline-label"><BgColorsOutlined /> Color</label>
              <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
              <label className="wb-inline-label">Brush</label>
              <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
              <span className="wb-size-badge">{brushSize}px</span>
            </div>
            <div className="wb-group">
              <div className="wb-group-title">Actions</div>
              <Button icon={<UndoOutlined />} onClick={undo} disabled={historyIndex <= 0}>Undo</Button>
              <Button icon={<RedoOutlined />} onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</Button>
              <Button onClick={() => setShowGrid((v) => !v)}>{showGrid ? 'Hide Grid' : 'Show Grid'}</Button>
              <Button onClick={clearCanvas}>Clear</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveWhiteboard}>Save PNG</Button>
            </div>
          </div>
          <div className={`whiteboard-canvas-wrap ${showGrid ? 'with-grid' : ''}`} ref={canvasWrapRef}>
            <canvas
              ref={canvasRef}
              className="whiteboard-canvas"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
        </Modal>
        <Modal
          title="Create Collaborative Note"
          className="upload-resource-modal"
          open={openNewNoteModal}
          onCancel={() => setOpenNewNoteModal(false)}
          footer={null}
        >
          <Form form={newNoteForm} layout="vertical" onFinish={createCollaborativeNote}>
            <Form.Item label="Programme" name="programmeId" rules={[{ required: true }]}>
              <Select
                placeholder="Select programme"
                options={programmes.map((p) => ({ label: p.name, value: p.id }))}
                onChange={(id) => {
                  newNoteForm.setFieldsValue({ moduleId: undefined });
                  loadModules(id);
                }}
              />
            </Form.Item>
            <Form.Item label="Module" name="moduleId" rules={[{ required: true }]}>
              <Select placeholder="Select module" options={modules.map((m) => ({ label: m.name, value: m.id }))} />
            </Form.Item>
            <Form.Item label="Title" name="title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Tags (comma separated)" name="tags" extra="Example: DS, DBMS, Midterm">
              <Input placeholder="e.g. DS, DBMS, Midterm" />
            </Form.Item>
            <Form.Item label="Initial Note Content" name="noteContent">
              <Input.TextArea rows={5} placeholder="Start writing initial collaborative content..." />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>Create Note</Button>
          </Form>
        </Modal>
      </main>
    </div>
  );
};

export default ResourceLibraryDashboard;
