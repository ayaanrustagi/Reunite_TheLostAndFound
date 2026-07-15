/**
 * @file claimController.js
 * @description Controller handling item claims, including retrieval, creation, updates (upserting), and deletions.
 * Integrates audit logging for tracking claims lifecycle.
 * @authors Ayaan Rustagi, Sree Kondapalli, Tushaar Singh
 */

const connectDB = require('../db');
const Claim = require('../models/Claim');
const { logAudit } = require('../utils/auditLogger');

/**
 * Retrieve all claims sorted by creation date in descending order.
 * Maps MongoDB _id field to id for frontend API client compatibility.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getAllClaims = async (req, res) => {
    try {
        await connectDB();
        const claims = await Claim.find({}).sort({ created_at: -1 }).lean();
        const mappedClaims = claims.map(c => ({ ...c, id: c._id }));
        res.json(mappedClaims);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve claims.' });
    }
};

/**
 * Create or update a claim (upsert).
 * Documents the claim state transition and logs the operation in the audit trail.
 * 
 * @param {Object} req - Express request object containing claim attributes
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.upsertClaim = async (req, res) => {
    try {
        await connectDB();
        const claimData = req.body;
        const id = claimData.id || claimData._id;

        if (!id) return res.status(400).json({ error: 'ID is required.' });

        const updateData = { ...claimData, _id: id };
        delete updateData.id;

        const existing = await Claim.findById(id).lean();
        const action = existing ? 'CLAIM_UPDATE' : 'CLAIM_CREATE';

        const updated = await Claim.findOneAndUpdate(
            { _id: id },
            updateData,
            { upsert: true, returnDocument: 'after', lean: true, setDefaultsOnInsert: true }
        );

        // Audit Log
        const requester = claimData._requester || { id: claimData.created_by || 'system', email: claimData.claimer_email || 'system' };

        await logAudit({
            userId: requester.id,
            userEmail: requester.email,
            action: action,
            resourceType: 'Claim',
            resourceId: id,
            details: {
                item_id: updated.item_id,
                status: updated.status
            }
        });

        res.json({ ...updated, id: updated._id });
    } catch (err) {
        res.status(400).json({ error: 'Failed to save claim.' });
    }
};

/**
 * Delete a claim by ID and record the removal action in the system audit logs.
 * 
 * @param {Object} req - Express request object with path param 'id'
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.deleteClaim = async (req, res) => {
    try {
        await connectDB();
        const { id } = req.params;
        const { requester_id, requester_email } = req.query;

        await Claim.deleteOne({ _id: id });

        await logAudit({
            userId: requester_id || 'system',
            userEmail: requester_email || 'system',
            action: 'CLAIM_DELETE',
            resourceType: 'Claim',
            resourceId: id,
            details: {}
        });

        res.json({ message: 'Claim deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete claim.' });
    }
};

   