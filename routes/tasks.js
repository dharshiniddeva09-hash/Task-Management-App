
const express = require("express");
const jwt = require("jsonwebtoken");
const Task = require("../models/Task");

const router = express.Router();

// Verify login token
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Please login first"
        });
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

// GET: View logged-in user's tasks
router.get("/", verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({
            user: req.userId
        }).sort({ createdAt: -1 });

        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get tasks"
        });
    }
});

// POST: Create a task
router.post("/", verifyToken, async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const task = await Task.create({
            title: title.trim(),
            description: description || "",
            user: req.userId
        });

        res.status(201).json({
            message: "Task created successfully",
            task
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create task"
        });
    }
});

// PATCH: Update task completion
router.patch("/:id", verifyToken, async (req, res) => {
    try {
        if (typeof req.body.completed !== "boolean") {
            return res.status(400).json({
                message: "Completed must be true or false"
            });
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.userId
            },
            {
                completed: req.body.completed
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        res.status(400).json({
            message: "Invalid task ID"
        });
    }
});


 // PUT: Edit task title and description
router.put("/:id", verifyToken, async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required"
            });
        }

        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.userId
            },
            {
                title: title.trim(),
                description: description || ""
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task updated successfully",
            task
        });
    } catch (error) {
        res.status(400).json({
            message: "Failed to update task"
        });
    }
});


// DELETE: Delete a task
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            message: "Invalid task ID"
        });
    }
});

module.exports = router;
