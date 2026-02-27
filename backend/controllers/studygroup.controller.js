
const StudyGroup = require("../models/StudyGroup");
const User = require("../models/User");

// @desc    Create a new study group
// @route   POST /api/studygroups
// @access  Private

exports.createStudyGroup = async (req, res) => {
 try {
    const {name, description, subject, maxMembers, meetingTime} = req.body;

    //Validation
    if (!name || !subject){
        return res.status(400)
        .json({
            message: "Please provide a name and subject",
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

    //Create group
    const studyGroup = await StudyGroup.create({
        name,
        description,
        subject,
        creator: req.user.id,
        meetingTime,
        maxMembers: maxMembers || 10,

    });
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

       const studyGroups = await StudyGroup.find({ isActive: true })
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

        //update files if provided
        const {name, description, subject, meetingTime, maxMembers, isActive} = req.body;

        if (name!== undefined) studyGroup.name = name;
        if (description !== undefined) studyGroup.description = description;
        if (subject !== undefined) studyGroup.subject = subject;
        if (meetingTime !== undefined) studyGroup.meetingTime = meetingTime;
        if (isActive !== undefined) studyGroup.isActive = isActive;


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


// @desc    seach study groups by subject
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
            subject: { $regex: subject, $options: "i" },
            isActive: true,
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
        const { subject, meetingTime } = req.body;

        //Build query
        const query = {
            isActive: true,
        };

        //add Subject filter is provided
        if (subject){
            query.subject = { $regex: subject, $options: "i" };
        }

        // add meeting time filter if provided
        if (meetingTime) {
            if (meetingTime.weekdays !== undefined) {
            query["meetingTime.weekdays"] = meetingTime.weekdays;
            }
            if (meetingTime.weekend !== undefined) {
                query["meetingTime.weekend"] = meetingTime.weekend;
            }
            if (meetingTime.morning !== undefined) {
                query["meetingTime.morning"] = meetingTime.morning;
            }
            if (meetingTime.evening !== undefined) {
                query["meetingTime.evening"] = meetingTime.evening;
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

        //Check if group is active
        if (!studyGroup.isActive){
            return res.status(400)
            .json({
                message: "This study group is no longer active",
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








