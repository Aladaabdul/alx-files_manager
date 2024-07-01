import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }

    let emailExist;
    try {
      emailExist = await dbClient.usersCollection.findOne({ email });
    } catch (error) {
      return res.status(500).send({ error: 'Unable find user' });
    }

    if (emailExist) {
      res.status(400).send({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);

    let user;
    try {
      user = await dbClient.usersCollection.insertOne({
        email,
        password: hashedPassword,
      });
    } catch (error) {
      return res.status(500).send({ error: 'unable to save user' });
    }

    const userResult = {
      id: user.insertedId,
      email,
    };

    return res.status(201).send(userResult);
  }
}

module.exports = UsersController;
