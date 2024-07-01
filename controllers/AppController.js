const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static getStatus(req, res) {
    const db = dbClient.isAlive();
    const redis = redisClient.isAlive();
    return res.status(200).send({ redis, db });
  }

  static async getStats(req, res) {
    return res.status(200).send({
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    });
  }
}

module.exports = AppController;
