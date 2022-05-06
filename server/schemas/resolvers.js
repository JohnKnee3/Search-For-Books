// const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");

const resolvers = {
  Query: {
    users: async () => {
      return User.find();
    },
  },
};

module.exports = resolvers;
