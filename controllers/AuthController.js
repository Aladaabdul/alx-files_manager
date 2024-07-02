const uuid = require('uuid');
const sha1 = require('sha1');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const Authorization = req.headers.authorization;

    const credential = Authorization.split(' ')[1];

    if (!credential) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const decodeCredential = Buffer.from(credential, 'base64').toString('utf-8');
    const [email, password] = decodeCredential.split(':');

    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const hashedPassword = sha1(password);
    const user = await dbClient.findUser({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuid.v4();
    const key = `auth_${token}`;
    const hours = 24;

    await redisClient.set(key, user._id.toString(), hours * 3600);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const { token } = req.header('X-Token');

    const user = await redisClient.get(token);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    await redisClient.del(token);
    return res.status(204).send();
  }
}

module.exports = AuthController;
