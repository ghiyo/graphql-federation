const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const fetch = require("node-fetch");

const port = 4002;
const apiUrl = 'http://localhost:3000';

// TODO: Why is there @key directive on the Astronaut typeDef but not for Mission?
// TODO: Why is the missions field added to the "extend type Astronaut" on 
//       this service and not on the Astronaut service? (is it because of convinience?)
const typeDefs = gql`
  type Mission {
    id: ID!
    crew: [Astronaut]
    designation: String!
    startDate: String
    endDate: String
  }

  extend type Astronaut @key(fields: "id") {
    id: ID! @external
    missions: [Mission]
  }

  extend type Query {
    mission(id: ID!): Mission
    missions: [Mission]
  }
`;

const resolvers = {
  Astronaut: {
    async missions(astronaut) {
      const res = await fetch(`${apiUrl}/missions`)
      const missions = await res.json();
      return missions.filter(({ crew }) => crew.includes(parseInt(astronaut.id)))
    }
  },
  Mission: {
    crew(mission) {
      return mission.crew.map(id => ({ __typename: "Astronaut", id }));
    }
  },
  Query: {
    mission(_, { id }) {
      return fetch(`${apiUrl}/missions/${id}`).then(res => res.json());
    },
    missions() {
      return fetch(`${apiUrl}/missions`).then(res => res.json());
    }
  }
}

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }])
})

server.listen(port).then(({ url }) => {
  console.log(`🚀 Astronauts service ready at ${url}`);
})