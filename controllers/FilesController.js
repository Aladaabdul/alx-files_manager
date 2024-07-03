const { v4: uuidv4 } = require('uuid');
const { promises: fs } = require('fs');
const path = require('path');
const mime = require('mime-types');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(token);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    let parent = null;
    if (parentId !== '0') {
      parent = await dbClient.findFile({ _id: dbClient.ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: dbClient.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? 0 : dbClient.ObjectId(parentId),
    };

    if (type === 'folder') {
      const result = await dbClient.insertFile(fileDocument);
      return res.status(201).json({
        id: result.insertedId,
        userId,
        name,
        type,
        isPublic,
        parentId,
      });
    }

    const localPath = path.join(FOLDER_PATH, uuidv4());
    await fs.mkdir(FOLDER_PATH, { recursive: true });

    const mimeType = mime.lookup(name);
    if (!mimeType) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    await fs.writeFile(localPath, Buffer.from(data, 'base64'));

    fileDocument.localPath = localPath;
    fileDocument.mimeType = mimeType;
    const result = await dbClient.insertFile(fileDocument);

    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic,
      parentId,
      localPath,
      mimeType,
    });
  }
}

module.exports = FilesController;
