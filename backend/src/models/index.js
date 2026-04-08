const QuizScore = require('./QuizScore');
const Student = require('./Student');
const ExtractedData = require('./ExtractedData');
const StudySession = require('./StudySession');
const ResourceItem = require('./ResourceItem');
const ResourceRequest = require('./ResourceRequest');
const ResourceProgramme = require('./ResourceProgramme');
const ResourceModule = require('./ResourceModule');
const ResourceRating = require('./ResourceRating');
const ResourceComment = require('./ResourceComment');
const ResourceRequestMessage = require('./ResourceRequestMessage');
const ResourceLibraryNotification = require('./ResourceLibraryNotification');
const ResourceLibraryNotificationRead = require('./ResourceLibraryNotificationRead');

ResourceProgramme.hasMany(ResourceModule, { foreignKey: 'programmeId' });
ResourceModule.belongsTo(ResourceProgramme, { foreignKey: 'programmeId' });
ResourceProgramme.hasMany(ResourceItem, { foreignKey: 'programmeId' });
ResourceModule.hasMany(ResourceItem, { foreignKey: 'moduleId' });
ResourceItem.belongsTo(ResourceProgramme, { foreignKey: 'programmeId' });
ResourceItem.belongsTo(ResourceModule, { foreignKey: 'moduleId' });
ResourceItem.hasMany(ResourceRating, { foreignKey: 'resourceId' });
ResourceRating.belongsTo(ResourceItem, { foreignKey: 'resourceId' });
ResourceItem.hasMany(ResourceComment, { foreignKey: 'resourceId' });
ResourceComment.belongsTo(ResourceItem, { foreignKey: 'resourceId' });
ResourceComment.hasMany(ResourceComment, { foreignKey: 'parentId', as: 'replies' });
ResourceComment.belongsTo(ResourceComment, { foreignKey: 'parentId', as: 'parent' });
ResourceRequest.hasMany(ResourceRequestMessage, { foreignKey: 'requestId' });
ResourceRequestMessage.belongsTo(ResourceRequest, { foreignKey: 'requestId' });
ResourceLibraryNotification.hasMany(ResourceLibraryNotificationRead, {
  foreignKey: 'notificationId',
  as: 'reads',
  onDelete: 'CASCADE'
});
ResourceLibraryNotificationRead.belongsTo(ResourceLibraryNotification, {
  foreignKey: 'notificationId',
  as: 'notification'
});

module.exports = {
  QuizScore,
  Student,
  ExtractedData,
  StudySession,
  ResourceItem,
  ResourceRequest,
  ResourceProgramme,
  ResourceModule,
  ResourceRating,
  ResourceComment,
  ResourceRequestMessage,
  ResourceLibraryNotification,
  ResourceLibraryNotificationRead
};
