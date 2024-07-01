import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export class AppController {
  static async getStatus(req, res) {
    const db = dbClient.isAlive();
    const redis = redisClient.isAlive();
    return res.status(200).json({ redis, db });
  }

  static async getStats(req, res) {
    const users = dbClient.nbUsers;
    const files = dbClient.nbFiles;

    return res.status(200).json({ users, files });
  }
}
