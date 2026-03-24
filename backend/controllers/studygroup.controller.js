
const { model } = require("mongoose");
const StudyGroup = require("../models/StudyGroup");
const User = require("../models/User");

// Helper function to check if two time slots overlap
const doTimeSlotsOverlap = (slot1Start, slot1End, slot2Start, slot2End) => {
    // Convert time strings to minutes for comparison
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };
    
    const start1 = timeToMinutes(slot1Start);
    const end1 = timeToMinutes(slot1End);
    const start2 = timeToMinutes(slot2Start);
    const end2 = timeToMinutes(slot2End);
    
    // Two time slots overlap if they share any time period
    // Allow back-to-back bookings (one ends exactly when another starts)
    // Overlap exists if: start1 < end2 AND start2 < end1
    // This naturally allows adjacent times (e.g., 11:00-12:00 and 12:00-13:00)
    return start1 < end2 && start2 < end1;
};

// Helper function to check for scheduling conflicts
const checkSchedulingConflict = async (hallAllocation, meetingTimes, excludeGroupId = null) => {
    // Find all groups with the same hall allocation
    const query = {
        'hallAllocation.building': hallAllocation.building,
        'hallAllocation.floor': hallAllocation.floor,
        'hallAllocation.lab': hallAllocation.lab,
    };
    
    // If updating, exclude the current group from the check
    if (excludeGroupId) {
        query._id = { $ne: excludeGroupId };
    }
    
    const conflictingGroups = await StudyGroup.find(query).select('name meetingTimes hallAllocation');
    
    // Check each meeting time for conflicts
    for (const newSlot of meetingTimes) {
        for (const existingGroup of conflictingGroups) {
            for (const existingSlot of existingGroup.meetingTimes) {
                // Check if same day and overlapping times
                if (newSlot.day === existingSlot.day) {
                    if (doTimeSlotsOverlap(newSlot.startTime, newSlot.endTime, existingSlot.startTime, existingSlot.endTime)) {
                        return {
                            conflict: true,
                            message: `Scheduling conflict: Lab ${hallAllocation.lab} is already booked by "${existingGroup.name}" on ${newSlot.day} from ${existingSlot.startTime} to ${existingSlot.endTime}.`,
                        };
                    }
                }
            }
        }
    }
    
    return { conflict: false };
};

// @desc    Create a new study group
// @route   POST /api/studygroups
// @access  Private

exports.createStudyGroup = async (req, res) => {
 try {
    const {name, description, subject, maxMembers, meetingTimes: meetingTimesRaw, hallAllocation: hallAllocationRaw, image} = req.body;

    // Parse JSON strings when data arrives via FormData (multipart)
    let meetingTimes = meetingTimesRaw;
    if (typeof meetingTimesRaw === 'string') {
        try { meetingTimes = JSON.parse(meetingTimesRaw); } catch { return res.status(400).json({ message: 'Invalid meetingTimes format' }); }
    }
    let hallAllocation = hallAllocationRaw;
    if (typeof hallAllocationRaw === 'string') {
        try { hallAllocation = JSON.parse(hallAllocationRaw); } catch { return res.status(400).json({ message: 'Invalid hallAllocation format' }); }
    }
    // If a file was uploaded via multer, use its path; otherwise fall back to body image field
    const imageValue = req.file ? `/uploads/study-groups/${req.file.filename}` : (image || undefined);

    //Validation
    if (!name || !subject){
        return res.status(400)
        .json({
            message: "Please provide a name and subject",
        });
    }

    if (!meetingTimes || meetingTimes.length === 0) {
        return res.status(400)
        .json({
            message: "Please provide at least one meeting time",
        });
    }

    if (!hallAllocation || !hallAllocation.building || !hallAllocation.floor || !hallAllocation.lab) {
        return res.status(400)
        .json({
            message: "Please provide hall allocation (building, floor, and lab)",
        });
    }

    //Check if group with same name already exists
    const existingGroup = await StudyGroup.findOne({
        name: { $regex: `^${name}$`, $options: "i" },
    });
    if (existingGroup){
        return res.status(400)
        .json({
            message: "A group with this name already exists.Please choose a different name.",
        });
    }

    // Check for scheduling conflicts
    const conflictCheck = await checkSchedulingConflict(hallAllocation, meetingTimes);
    if (conflictCheck.conflict) {
        return res.status(400)
        .json({
            message: conflictCheck.message,
        });
    }

    //Create group
    const groupData = {
        name,
        description,
        subject,
        creator: req.user.id,
        meetingTimes,
        maxMembers: maxMembers || 10,
        hallAllocation,
    };
    
    // Add image if provided (uploaded file takes priority over URL)
    if (imageValue) {
        groupData.image = imageValue;
    }
    
    const studyGroup = await StudyGroup.create(groupData);
    
    //Add group to user's studyGroups
    await User.findByIdAndUpdate(req.user.id, {
        $push: { studyGroups: studyGroup._id },
    });

    //Populate creators details
    await studyGroup.populate("creator", "name email degree year");

    res.status(201)
    .json({
        message: "Study group created successfully",
        studyGroup,
    });

 } catch (error) {
    res.status(500)
    .json({
        message: error.message,
    });
 }

};


// @desc    Get all study groups
// @route   GET /api/studygroups
// @access  Private

exports.getAllStudyGroups = async (req, res) => {
    try {

       const studyGroups = await StudyGroup.find()
          .populate("creator", "name email degree year")
          .populate("members", "name email degree year")
            .sort({ createdAt: -1 });

        res.status(200)
        .json({
            count: studyGroups.length,
            studyGroups,
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};


//@desc Update a study group(Creators only)
exports.updateStudyGroup = async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup){
            return res.status(404)
            .json({
                message: "Study group not found",
            });
        }

        //Check if user is the creator
        if (studyGroup.creator.toString() !== req.user.id){
            return res.status(403)
            .json({
                message : "Only the group creator can update the group",
            });
        }

        //update fields if provided
        const {name, description, subject, meetingTimes, maxMembers, hallAllocation, image} = req.body;

        if (name!== undefined) studyGroup.name = name;
        if (description !== undefined) studyGroup.description = description;
        if (subject !== undefined) studyGroup.subject = subject;
        if (image !== undefined) studyGroup.image = image;
        
        if (meetingTimes !== undefined) {
            if (meetingTimes.length === 0) {
                return res.status(400).json({
                    message: "At least one meeting time is required",
                });
            }
            studyGroup.meetingTimes = meetingTimes;
        }
        
        // Update hall allocation if provided
        if (hallAllocation !== undefined) {
            if (!hallAllocation.building || !hallAllocation.floor || !hallAllocation.lab) {
                return res.status(400).json({
                    message: "Hall allocation must include building, floor, and lab",
                });
            }
            studyGroup.hallAllocation = hallAllocation;
        }
        
        // Check for scheduling conflicts (only if meetingTimes or hallAllocation changed)
        if (hallAllocation !== undefined || meetingTimes !== undefined) {
            const timesToCheck = meetingTimes !== undefined ? meetingTimes : studyGroup.meetingTimes;
            const hallToCheck = hallAllocation !== undefined ? hallAllocation : studyGroup.hallAllocation;
            
            const conflictCheck = await checkSchedulingConflict(hallToCheck, timesToCheck, studyGroup._id);
            if (conflictCheck.conflict) {
                return res.status(400).json({
                    message: conflictCheck.message,
                });
            }
        }


     //check if maxMember is valid
        if (maxMembers !== undefined){
            if (maxMembers < studyGroup.members.length){
                return res.status(400)
                .json({
                    message: `Can not set max members to ${maxMembers}. Current member count is ${studyGroup.members.length}`,
                });
            }
            studyGroup.maxMembers = maxMembers;
        }

        await studyGroup.save();


        //Populate  and return updated group
        await studyGroup.populate("creator", "name email");
        await studyGroup.populate("members", "name email degree year");

        res.status(200)
        .json({
            message: "Study group updated successfully",
            studyGroup,
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};

// @desc    Get a single study group by ID
// @route   GET /api/studygroups/:id
// @access  Private

exports.getStudyGroupById = async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id)
        .populate("creator", "name email degree year")
        .populate("members", "name email degree year");

        if (!studyGroup){
            return res.status(404)
            .json({
                message: "Study group not found",
            });
        }
        res.status(200)
        .json({
            studyGroup,
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};


// @desc    Search study groups by subject
// @route   GET /api/studygroups/search?subject=Math
// @access  Private
exports.searchStudyGroupsBySubject = async (req, res) => {
    try {
        const { subject } = req.query;

        if (!subject){
            return res.status(400)
            .json({
                message: "Please provide a subject to search",
            });
        }

        const studyGroups = await StudyGroup.find({
            subject: { $regex: subject, $options: "i" }
        })
        .populate("creator", "name")
        .populate("members", "name")
        .sort({ createdAt: -1 });


        res.status(200)
        .json({
            count: studyGroups.length,
            studyGroups,
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};


// @desc    Search study groups by meeting time
// @route   POST /api/studygroups/search/availability
// @access  Private

exports.searchStudyGroupsByAvailability = async (req, res) => {
    try {
        const { subject, day, startTime, endTime } = req.body;

        //Build query
        const query = {
        };

        //add Subject filter is provided
        if (subject){
            query.subject = { $regex: subject, $options: "i" };
        }

        // add meeting time filter if provided
        if (day || startTime || endTime) {
            query.meetingTimes = {
                $elemMatch: {},
            };

            if (day) {
                query.meetingTimes.$elemMatch.day = day;
            }

            if (startTime) {
                query.meetingTimes.$elemMatch.startTime = { $lte: startTime };
            }

            if (endTime) {
                query.meetingTimes.$elemMatch.endTime = { $gte: endTime };
            }
       }
        

        const studyGroups = await StudyGroup.find(query)
        .populate("creator", "name email")
        .populate("members", "name")
        .sort({ createdAt: -1 });

        res.status(200)
        .json({
            count: studyGroups.length,
            studyGroups,
        });


    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }

};

// @desc    Join a study group
// @route   POST /api/studygroups/:id/join
// @access  Private

exports.joinStudyGroup = async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup){
            return res.status(404)
            .json({
                message: "Study group not found",
            });
        }

        //Check if user is already a member
        if (studyGroup.members.includes(req.user.id)){
            return res.status(400)
            .json({
                message: "You are already a member of this group",
            });
        }

        //Check if group is full
        if (studyGroup.isFull()){
            return res.status(400)
            .json({
                message: "This group is already full",
            });
        }

        //Add user to group
        studyGroup.members.push(req.user.id);
        await studyGroup.save();

        //Add group to user's studyGroups array
        await User.findByIdAndUpdate(req.user.id, {
            $push: { studyGroups: studyGroup._id },
        });

        //Populate and return updated group
        await studyGroup.populate("creator", "name email");
        await studyGroup.populate("members", "name email degree year");

        res.status(200)
        .json({
            message: "Successfully joined the study group",
            studyGroup,
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};



// @desc    Leave a study group
// @route   POST /api/studygroups/:id/leave
// @access  Private
exports.leaveStudyGroup = async (req, res) => {
    try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup){
            return res.status(404)
            .json({
                message: "Study group not found",
            });
        }


        //Check if user is a member
        if (!studyGroup.members.includes(req.user.id)){
            return res.status(400)
            .json({
                message: "You are not a member of this group",
            });
        }

        //Creator cannot leave the group
        if (studyGroup.creator.toString() === req.user.id){
            return res.status(400)
            .json({
                message: "Group creator cannot leave the group. Please delete the group instead.",
            });
        }
        //Remove user from group
        studyGroup.members = studyGroup.members.filter(
            (memberId) => memberId.toString() !== req.user.id
        );
        await studyGroup.save();

        //Remove group from user's studyGroups array
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { studyGroups: studyGroup._id },
        });

        res.status(200)
        .json({
            message: "Successfully left the study group",
        });

    } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
    }
};

// @desc    Delete a study group(Creators only)
// @route   DELETE /api/studygroups/:id
// @access  Private

exports.deleteStudyGroup = async (req, res) => {

     try {
        const studyGroup = await StudyGroup.findById(req.params.id);

        if (!studyGroup){
            return res.status(404)
            .json({
                message: "Study group not found",
            });
        }

        //Check if user is the creator
        if (studyGroup.creator.toString() !== req.user.id){
            return res.status(403)
            .json({
                message : "Only the group creator can delete the group",
            });
        }
        //Remove group from all members' studyGroups array
        await User.updateMany(
            { studyGroups: studyGroup._id },
            { $pull: { studyGroups: studyGroup._id } }
        );

        //Delete the group
        await StudyGroup.findByIdAndDelete(req.params.id);

        res.status(200)
        .json({
            message: "Study group deleted successfully",
        });

     } catch (error) {
        res.status(500)
        .json({
            message: error.message,
        });
     }
};

// @desc    Update study group image
// @route   PUT /api/studygroups/:id/image
// @access  Private (only creator)
exports.updateStudyGroupImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image file",
            });
        }

        const studyGroup = await StudyGroup.findById(id);
        
        if (!studyGroup) {
            return res.status(404).json({
                message: "Study group not found",
            });
        }

        // Check if user is the creator
        if (studyGroup.creator.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only update your own study groups",
            });
        }

        // Delete old image file if exists
        if (studyGroup.image) {
            const fs = require('fs');
            const path = require('path');
            const oldImagePath = path.join(__dirname, '..', studyGroup.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update with new image
        const imagePath = `/uploads/study-groups/${req.file.filename}`;
        studyGroup.image = imagePath;
        studyGroup.updatedAt = Date.now();
        await studyGroup.save();

        res.status(200).json({
            message: "Study group image updated successfully",
            image: imagePath,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// @desc    Update study group details
// @route   PUT /api/studygroups/:id
// @access  Private (only creator)
exports.updateStudyGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, subject, maxMembers, meetingTimes: meetingTimesRaw } = req.body;

        const studyGroup = await StudyGroup.findById(id);
        
        if (!studyGroup) {
            return res.status(404).json({
                message: "Study group not found",
            });
        }

        // Check if user is the creator
        if (studyGroup.creator.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You can only update your own study groups",
            });
        }

        // Parse meetingTimes if it's a JSON string (from FormData)
        let meetingTimes;
        if (meetingTimesRaw) {
            try {
                meetingTimes = typeof meetingTimesRaw === 'string' 
                    ? JSON.parse(meetingTimesRaw) 
                    : meetingTimesRaw;
            } catch (parseError) {
                return res.status(400).json({
                    message: "Invalid meetingTimes format",
                });
            }
        }

        // Parse hallAllocation if it's a JSON string (from FormData)
        const hallAllocationRaw = req.body.hallAllocation;
        let hallAllocation;
        if (hallAllocationRaw) {
            try {
                hallAllocation = typeof hallAllocationRaw === 'string'
                    ? JSON.parse(hallAllocationRaw)
                    : hallAllocationRaw;
            } catch (parseError) {
                return res.status(400).json({ message: "Invalid hallAllocation format" });
            }
            if (!hallAllocation.building || !hallAllocation.floor || !hallAllocation.lab) {
                return res.status(400).json({
                    message: "Hall allocation must include building, floor, and lab",
                });
            }
        }

        // Update fields
        if (name) studyGroup.name = name;
        if (description !== undefined) studyGroup.description = description;
        if (subject) studyGroup.subject = subject;
        if (maxMembers) studyGroup.maxMembers = Number(maxMembers);
        if (meetingTimes && meetingTimes.length > 0) studyGroup.meetingTimes = meetingTimes;
        if (hallAllocation) studyGroup.hallAllocation = hallAllocation;

        // Check for scheduling conflicts if times or hall changed
        if (hallAllocation || meetingTimes) {
            const timesToCheck = meetingTimes || studyGroup.meetingTimes;
            const hallToCheck = hallAllocation || studyGroup.hallAllocation;
            const conflictCheck = await checkSchedulingConflict(hallToCheck, timesToCheck, studyGroup._id);
            if (conflictCheck.conflict) {
                return res.status(400).json({ message: conflictCheck.message });
            }
        }

        // Handle image upload if provided
        if (req.file) {
            // Delete old image file if exists
            if (studyGroup.image) {
                const fs = require('fs');
                const path = require('path');
                const oldImagePath = path.join(__dirname, '..', studyGroup.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            studyGroup.image = `/uploads/study-groups/${req.file.filename}`;
        }
        
        studyGroup.updatedAt = Date.now();
        await studyGroup.save();

        // Populate creator info
        await studyGroup.populate("creator", "name email degree year");

        res.status(200).json({
            message: "Study group updated successfully",
            studyGroup,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = exports;








