const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name for the study group'],
            trim: true,
            minlength: [3, "Group name must be at least 3 Characters"],
            maxlength: [50, "Group name can not exceed 50 Characters"],
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: [500, "Description can not exceed 500 Characters"],
        },
        subject: {
            type: String,
            required: [true, 'Please provide a subject'],
            trim: true,
            minlength: [2, "Subject must be at least 2 Characters"],
        },
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, 'Group must have a creator'],
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        maxMembers: {
            type: Number,
            default: 10,
            min: [2, "Group must have at least 2 members"],
            max: [50, "Group can not have more than 50 members"],
        },
        meetingTime: {
            weekdays: { type: Boolean, default: false },
            weekend: { type: Boolean, default: false },
            morning: { type: Boolean, default: false },
            evening: { type: Boolean, default: false },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Validation: Check if group is full before adding member (method for external use)
studyGroupSchema.methods.isFull = function () {
    return this.members.length >= this.maxMembers;
};

// Adding creator to members array when group is created AND validate
studyGroupSchema.pre("save", async function () {
    // Only for new groups
    if (this.isNew) {
        // Add creator to members if not already there (compare as strings for ObjectId)
        const creatorId = this.creator.toString();
        const memberIds = this.members.map(m => m.toString());
        
        if (!memberIds.includes(creatorId)) {
            this.members.push(this.creator);
        }
        
        // Validate meeting time
        if (this.meetingTime) {
            const mt = this.meetingTime;
            if (!mt.weekdays && !mt.weekend && !mt.morning && !mt.evening) {
                throw new Error("At least one meeting time must be selected");
            }
        }
        
        // Validate member count
        if (this.members.length > this.maxMembers) {
            throw new Error("Cannot add more members, group is full");
        }
    }
});

module.exports = mongoose.model("StudyGroup", studyGroupSchema);