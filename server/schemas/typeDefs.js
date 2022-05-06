// import the gql tagged template function
const { gql } = require("apollo-server-express");

// create our typeDefs
const typeDefs = gql`
  type User {
    userName: String
  }

  type Query {
    users: [User]
  }
`;
// export the typeDefs
module.exports = typeDefs;
