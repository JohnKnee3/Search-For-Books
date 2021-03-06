# 21.1.3

Set up the base files from the module. Ran npm i and npm run seed. May need to go back and run mongod if the seed didn't run properly. At a glance in the console.log it looks like it did.

# 21.1.4

We set up our first query. We essentially learned that GraphQL calls all GETs query and all PUT, POST, and DELETEs mutations. We created a new folder called schema and added the index.js like this.

const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");

module.exports = { typeDefs, resolvers };

To require the first file we need called typeDefs like this.

// import the gql tagged template function
const { gql } = require("apollo-server-express");

// create our typeDefs
const typeDefs = gql` type Query { helloWorld: String }`;
// export the typeDefs
module.exports = typeDefs;

This defines what we are looking for and where we can find it. Then we set up the resolvers to preform this like this.

const resolvers = {
Query: {
helloWorld: () => {
return "Hello world!";
},
},
};

module.exports = resolvers;

Here we are running the helloWrold() called in the type Query object and returning a string that says "Hello World". Then we went into server.js and added a ton of things that basically required graphQL apollo to run. Lastly we ran npm run watch to fire the package.json script that takes us to a browser that looks like GraphQL's version of insomnia and tested the the query.

# 21.1.5

Here we did our first test to grab all thoughts like this in typeDef.

type Thought {
\_id: ID
thoughtText: String
createdAt: String
username: String
reactionCount: Int
}

type Query {
thoughts: [Thought]
}

This creates the thoughts array and then defins what it will grab. The we slid into resolvers.js and added this.

const resolvers = {
Query: {
thoughts: async () => {
return Thought.find().sort({ createdAt: -1 });
}
}
};

Which perfoms a find query to grab all thoughts and sorts them by created at. Up top we required the models and then juped into the graphql browser. In there we typed this..

query {
thoughts {
\_id
username
thoughtText
createdAt
}
}

This went through thoughts and grabbed everyting we defined in the object. Also we can remove or add anything from lines 43-47 to change what is shown because that is where we dfined them. Next we brought in the ability to search by user by passing in a parameter into the thoughts typeDef like this.

type Query {
thoughts(username: String): [Thought]
}

and then went into the resolver.js to use it here like this.

thoughts: async (parent, { username }) => {
const params = username ? { username } : {};
return Thought.find(params).sort({ createdAt: -1 });
},

This is saying if username then params = {username} else params = {}. This makes it so we can sort by indvidual user by going into the graphql browser and typing this.

query {
thoughts (username: "Domenica.OConnell") {
\_id
username
thoughtText
createdAt
}
}

Domenica.OConnell is a random user generated by the program. Lastly we added the ability to grab reaction by simply adding this to typeDef.

const typeDefs = gql`

type Thought {
\_id: ID
thoughtText: String
createdAt: String
username: String
reactionCount: Int
reactions: [Reaction]
}

type Reaction {
\_id: ID
reactionBody: String
createdAt: String
username: String
}

type Query {
thoughts(username: String): [Thought]
}
`;

Then we went back into the graphql browser and added this to grab all reactions and thoughts.

query {
thoughts {
\_id
username
thoughtText
reactions {
\_id
createdAt
username
reactionBody
}
}
}

# 21.1.6

Here we quickly added the new User type and updated the query to search by all users and one user and all thoughts and one thought like this.

type Query {
users: [User]
user(username: String!): User
thoughts(username: String): [Thought]
thought(\_id: ID!): Thought
}

type User {
\_id: ID
username: String
email: String
friendCount: Int
thoughts: [Thought]
friends: [User]
}

The rest was testing the querys and basically setting up mega querys to grab everthing and then collapsing the data to parse through what you want all in graphql. The last thing we did was practice sending in a variable through graphQL as well. I saved both of these moving forward as I think they will remain useful. There is a ton of data here so coming back reading this may be helpful in terms of understandin graphQL.

# 21.2.3

We added the ability for a user to create an account and log in. First in typeDefs.js we added this to accept mutations.

type Mutation {
login(email: String!, password: String!): User
addUser(username: String!, email: String!, password: String!): User
}

Then we went into resolvers.s and added this to create the ability to make a user.

addUser: async (parent, args) => {
const user = await User.create(args);

return user;
}

This accepts the username, password and email and uses this info to make an account. Then in graphQL we added this.

mutation {
addUser(username:"tester", password:"test12345", email:"test@test.com") {
\_id
username
email
}
}

Then we switched it to variables.

mutation addUser($username: String!, $password: String!, $email: String!) {
addUser(username: $username, password: $password, email: $email) {
\_id
username
email
}
}

and passed in this.

{
"username": "tester2",
"password": "test12345",
"email": "test2@test.com"
}

Both of these created users just the second one is closer to what it will acutally look like once we have the front end hooked up. Finally up top we added this.

const { AuthenticationError } = require('apollo-server-express');

and then this in the login section.

login: async (parent, { email, password }) => {
const user = await User.findOne({ email });

if (!user) {
throw new AuthenticationError('Incorrect credentials');
}

const correctPw = await user.isCorrectPassword(password);

if (!correctPw) {
throw new AuthenticationError('Incorrect credentials');
}

return user;
}

to make sure we get tossed an error if the log in was not valid. Then using variables we went into graphQL and used.

mutation login($email: String!, $password: String!) {
login(email: $email, password: $password) {
\_id
username
email
}
}

and this

{
"email": "test2@test.com",
"password": "test12345"
}

to log in as an existing user.

# 21.2.4 & 21.2.5

Here we learned about authentication. This was fairly confusing but the main thing that tripped me up was the header. Make sure moving forward that the key is "Authorization" and the Value is "Bearer <insert token here>". The bearer bit was the part i missed. All of this is worth another read when it comes time to do the project.

# 21.2.6

A really insteresting one that added the ability to add thoughts, reactions and friends. First we went into the typeDefs.js and added this to the mutation.

type Mutation {
login(email: String!, password: String!): Auth
addUser(username: String!, email: String!, password: String!): Auth
addThought(thoughtText: String!): Thought
addReaction(thoughtId: ID!, reactionBody: String!): Thought
addFriend(friendId: ID!): User
}

Then we went into the resolvers and added the ability to add a thought like this.

addThought: async (parent, args, context) => {
if (context.user) {
const thought = await Thought.create({
...args,
username: context.user.username,
});

        await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { thoughts: thought._id } },
          { new: true }
        );

        return thought;
      }

      throw new AuthenticationError("You need to be logged in!");
    },

      This for this in graphQL we added this.

      mutation addThought($thoughtText: String!) {

addThought(thoughtText: $thoughtText) {
\_id
thoughtText
createdAt
username
reactionCount
}
}

with the thoughtText variable passed in to modify the text making sure we were logged in via the header. Then we added a reaction by passing this into resolvers.js.

addReaction: async (parent, { thoughtId, reactionBody }, context) => {
if (context.user) {
const updatedThought = await Thought.findOneAndUpdate(
{ \_id: thoughtId },
{
$push: {
reactions: { reactionBody, username: context.user.username },
},
},
{ new: true, runValidators: true }
);

        return updatedThought;
      }

      throw new AuthenticationError("You need to be logged in!");
    },

Then we went into the graphQL and added this.

    mutation addReaction($thoughtId: ID!, $reactionBody: String!) {

addReaction(thoughtId: $thoughtId, reactionBody: $reactionBody) {
\_id
reactionCount
reactions {
\_id
reactionBody
createdAt
username
}
}
}

We passed in a thoughtId which I had to look up to find a real one and then typed whatever we wanted into the reactionBody. Finally again since this is using context we had to make sure the header passed in an active token like before. Lastly we created the ability to add a friend like this in resolvers.js.

addFriend: async (parent, { friendId }, context) => {
if (context.user) {
const updatedUser = await User.findOneAndUpdate(
{ \_id: context.user.\_id },
{ $addToSet: { friends: friendId } },
{ new: true }
).populate("friends");

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },

Then we had to look up a vild user name and pass that in to this.

mutation addFriend($friendId: ID!) {
addFriend(friendId: $friendId) {
\_id
username
friendCount
friends {
\_id
username
}
}
}

So the friendId could have a valid ud tied to a username. Once again since this has context in it we had to make sure the header matched an active token tied to an id.

# 21.3.3

Got all the basic files in for react. We removed the package-lock.json right now which I found funny beacuase they claimed it will cause problems. I assume it will make it's way back once we get going.

# 21.3.4

Here we set up the app.js to include apollo. First we navigated to the root of client and ran this.

npm i @apollo/client graphql

Which installed the apollo/client and graphql. Then we went into the app and imported appllo like this.

import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

Next we added an absolute path to our backend and created the variable client to create a new intance of the ApolloClient and the MemoryCache like this.

const httpLink = createHttpLink({
uri: 'http://localhost:3001/graphql',
});

const client = new ApolloClient({
link: httpLink,
cache: new InMemoryCache(),
});

Finally in the JSX return statement we wrapped everthing that was there in a <ApolloProvider client={client}></ApolloProvider> like this.

function App() {
return (
<ApolloProvider client={client}>

<div className="flex-column justify-flex-start min-100-vh">
<Header />
<div className="container">
<Home />
</div>
<Footer />
</div>
</ApolloProvider>
);
}

We are now about to set up a query to see if this works.

# 21.3.5

Here we linked the thoughts data from the database to the actual page. First in the client/src folder we created a utils folder and added queries.js. In this we added our first QUERY_THOUGHTS query to the program and exported it like this.

import { gql } from '@apollo/client';

export const QUERY_THOUGHTS = gql` query thoughts($username: String) { thoughts(username: $username) { _id thoughtText createdAt username reactionCount reactions { _id createdAt username reactionBody } } }`;

We aslo had to import and then wrap the entire query in the gql variable. Next we went into Home.js and required uesQuery and the newly created QUERY_THOUGHTS up top and then updated the Home() to look like this.

import { useQuery } from '@apollo/client';
import { QUERY_THOUGHTS } from '../utils/queries';

const Home = () => {
// use useQuery hook to make query request
const { loading, data } = useQuery(QUERY_THOUGHTS);
const thoughts = data?.thoughts || [];
console.log(thoughts);

return (

<main>
<div className='flex-row justify-space-between'>
<div className='col-12 mb-3'>{/_ PRINT THOUGHT LIST _/}</div>
</div>
</main>
);
};

We also had to toss in this data?.thoughts || [] to say if data is real then add it if not send back an empty array. Next we fired up the backend from the server terminal with `npm run watch` and the client terminal with `npm start`. Checking the console we see an empty array as we are waiting for the data to appear and then a populated array once the data is retreived from the back-end. Finally we went into the components and created a way to display this info with a file called ThougtList. In this we added this.

import React from "react";

const ThoughtList = ({ thoughts, title }) => {
if (!thoughts.length) {
return <h3>No Thoughts Yet</h3>;
}

return (

<div>
<h3>{title}</h3>
{thoughts &&
thoughts.map((thought) => (
<div key={thought._id} className="card mb-3">
<p className="card-header">
{thought.username}
thought on {thought.createdAt}
</p>
<div className="card-body">
<p>{thought.thoughtText}</p>
<p className="mb-0">
Reactions: {thought.reactionCount} || Click to{" "}
{thought.reactionCount ? "see" : "start"} the discussion!
</p>
</div>
</div>
))}
</div>
);
};

export default ThoughtList;

Which was nothing more than a copy paste to get things displayed. Then we went back into the Home.js and required this new folder up top and it to the like this.

import React from "react";
import ThoughtList from "../components/ThoughtList";
import { useQuery } from "@apollo/client";
import { QUERY_THOUGHTS } from "../utils/queries";

const Home = () => {
// use useQuery hook to make query request
const { loading, data } = useQuery(QUERY_THOUGHTS);
const thoughts = data?.thoughts || [];
console.log(thoughts);

return (

<main>
<div className="flex-row justify-space-between">
<div className="col-12 mb-3">
{loading ? (
<div>Loading...</div>
) : (
<ThoughtList
              thoughts={thoughts}
              title="Some Feed for Thought(s)..."
            />
)}
</div>
</div>
</main>
);
};

export default Home;

Once all this is in the site displays. Next they claim we are going to remove the need to have 2 terminals running to make this page work.

# 21.3.6

set up the files to run on one terminal command by creating a root package.json installing concurrently and then setting up as few other things. This will be needed for the future to be able to set up all my react files.

# 21.4.3

Just discovered the client/package.json will break the module. Need to update the package.json to "react-router-dom": "^6.0.0",. But anyways this introduced ReactRouter which makes a SPA act like a multipage document. First we installed react-router with this `npm install react-router-dom` in the terminal and then we went into our app.js and imported it up top like this.

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

Next we imported links to all our other files that will be loaded when selected like this.

import Login from './pages/Login';
import NoMatch from './pages/NoMatch';
import SingleThought from './pages/SingleThought';
import Profile from './pages/Profile';
import Signup from './pages/Signup';

Finally we updtaed the app() to look like this.

function App() {
return (
<ApolloProvider client={client}>
<Router>

<div className="flex-column justify-flex-start min-100-vh">
<Header />
<div className="container">
<Routes>
<Route path="/" element={<Home />} />
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<Signup />} />
<Route path="/profile" element={<Profile />} />
<Route path="/thought" element={<SingleThought />} />

              <Route path="*" element={<NoMatch />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </ApolloProvider>

);
}

Here we have several nested <Route>'s that will trigger the imported path when selected. These are all nested within <Routes> which is inside of <Router> which are all of the variables we imported up top. As is stands right now we can click on a page and be redirectd to it. But the fancy bi here is that if we hit back on the browser we will then be brought back to the page previous simulating a multi page site.

# 21.4.4

Here we met the link feature of react-router. First we went into the header and updated it to import the link and use it like this.

import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
return (

<header className="bg-secondary mb-4 py-2 flex-row align-center">
<div className="container flex-row justify-space-between-lg justify-center align-center">
<Link to="/">
<h1>Deep Thoughts</h1>
</Link>

        <nav className="text-center">
          <Link to="/login">Login</Link>
          <Link to="/signup">Signup</Link>
        </nav>
      </div>
    </header>

);
};

export default Header;

Here we added a login and a signup page and linked out to them using the iported variable. Then we went into ThoughtList and got the bones for the Links set up there like this.

import React from "react";
import { Link } from "react-router-dom";

const ThoughtList = ({ thoughts, title }) => {
if (!thoughts.length) {
return <h3>No Thoughts Yet</h3>;
}

return (

<div>
<h3>{title}</h3>
{thoughts &&
thoughts.map((thought) => (
<div key={thought._id} className="card mb-3">
<p className="card-header">
<Link
to={`/profile/${thought.username}`}
style={{ fontWeight: 700 }}
className="text-light" >
{thought.username}
</Link>{" "}
thought on {thought.createdAt}
</p>
<div className="card-body">
<Link to={`/thought/${thought._id}`}>
<p>{thought.thoughtText}</p>
<p className="mb-0">
Reactions: {thought.reactionCount} || Click to{" "}
{thought.reactionCount ? "see" : "start"} the discussion!
</p>
</Link>
</div>
</div>
))}
</div>
);
};

export default ThoughtList;

Next we had to go update the app.js to allow links like this.

<Route
path="/profile/:username?"
element={<Profile />}
/>
<Route
path="/thought/:id"
element={<SingleThought />}
/>

Here we added the variables to the path so when we click it the id or username will show up top in the url. Finally we went into singThought to pull the id from the url with useParams like this.

import React from "react";
import { useParams } from "react-router-dom";

const SingleThought = (props) => {
const { id: thoughtId } = useParams();
console.log("they made me do it", thoughtId);
return (

<div>
<div className="card mb-3">
<p className="card-header">
<span style={{ fontWeight: 700 }} className="text-light">
Username
</span>{" "}
thought on createdAt
</p>
<div className="card-body">
<p>Thought Text</p>
</div>
</div>
</div>
);
};

export default SingleThought;

As of right now we are only console.logging it but that will change in the future.

# 21.4.5

Here we got the single page to render and show it's reactions. First we added a new query to grab a single thought to the queries.js like this.

export const QUERY_THOUGHT = gql` query thought($id: ID!) { thought(_id: $id) { _id thoughtText createdAt username reactionCount reactions { _id createdAt username reactionBody } } }`;

Then went back to single thought and required it, set up it's function and added it to the JSX return statment like this.

iimport React from "react";
import { useParams } from "react-router-dom";
import ReactionList from "../components/ReactionList";

import { useQuery } from "@apollo/client";
import { QUERY_THOUGHT } from "../utils/queries";

const SingleThought = (props) => {
const { id: thoughtId } = useParams();

const { loading, data } = useQuery(QUERY_THOUGHT, {
variables: { id: thoughtId },
});

const thought = data?.thought || {};

if (loading) {
return <div>Loading...</div>;
}
return (

<div>
<div className="card mb-3">
<p className="card-header">
<span style={{ fontWeight: 700 }} className="text-light">
{thought.username}
</span>{" "}
thought on {thought.createdAt}
</p>
<div className="card-body">
<p>{thought.thoughtText}</p>
</div>
</div>

      {thought.reactionCount > 0 && (
        <ReactionList reactions={thought.reactions} />
      )}
    </div>

);
};

export default SingleThought;

As you can see at the bottom we set up a spot for reactions so we had to do to components and create a ReactionList folder with an index.js like this.

import React from "react";
import { Link } from "react-router-dom";

const ReactionList = ({ reactions }) => {
return (

<div className="card mb-3">
<div className="card-header">
<span className="text-light">Reactions</span>
</div>
<div className="card-body">
{reactions &&
reactions.map((reaction) => (
<p className="pill mb-3" key={reaction._id}>
{reaction.reactionBody} {"// "}
<Link
to={`/profile/${reaction.username}`}
style={{ fontWeight: 700 }} >
{reaction.username} on {reaction.createdAt}
</Link>
</p>
))}
</div>
</div>
);
};

export default ReactionList;

Once in all single comments and reactions display. You can also click on the username in the reaction to be redirected to their userprofile page. Speaking of the next step is to get that user profile page working.

# 21.4.6

More version control issues. This time I discovered that the "?" in the app.js for the profile page is incorrect. That is old version 5 syntax yet this is written with mostly version 6. With all that being said this last page simply set up the display of the userPage. First we slapped a new query in there like this.

export const QUERY_USER = gql` query user($username: String!) { user(username: $username) { _id username email friendCount friends { _id username } thoughts { _id thoughtText createdAt reactionCount } } }`;

Then went into Profile.js and updated it so it looked like this.

import { useParams } from 'react-router-dom';

import ThoughtList from '../components/ThoughtList';

import { useQuery } from '@apollo/client';
import { QUERY_USER } from '../utils/queries';

onst Profile = () => {
const { username: userParam } = useParams();

const { loading, data } = useQuery(QUERY_USER, {
variables: { username: userParam }
});

const user = data?.user || {};

if (loading) {
return <div>Loading...</div>;
}

return (

<div>
<div className="flex-row mb-3">
<h2 className="bg-dark text-secondary p-3 display-inline-block">
Viewing {user.username}'s profile.
</h2>
</div>

      <div className="flex-row justify-space-between mb-3">
        <div className="col-12 mb-3 col-lg-8">
          <ThoughtList thoughts={user.thoughts} title={`${user.username}'s thoughts...`} />
        </div>
      </div>
    </div>

);
};

Lastly we wanted to make a friends list so we made a new component called FriendsList/index.js and added this in.

import React from 'react';
import { Link } from 'react-router-dom';

const FriendList = ({ friendCount, username, friends }) => {
if (!friends || !friends.length) {
return <p className="bg-dark text-light p-3">{username}, make some friends!</p>;
}

return (

<div>
<h5>
{username}'s {friendCount} {friendCount === 1 ? 'friend' : 'friends'}
</h5>
{friends.map(friend => (
<button className="btn w-100 display-block mb-2" key={friend._id}>
<Link to={`/profile/${friend.username}`}>{friend.username}</Link>
</button>
))}
</div>
);
};

export default FriendList;

Finally we revivisited the Profile.js to iport it and upadted the JSX return so everything looked like this.

import React from "react";
import { useParams } from "react-router-dom";

import ThoughtList from "../components/ThoughtList";
import FriendList from "../components/FriendList";

import { useQuery } from "@apollo/client";
import { QUERY_USER } from "../utils/queries";

const Profile = (props) => {
const { username: userParam } = useParams();

const { loading, data } = useQuery(QUERY_USER, {
variables: { username: userParam },
});

const user = data?.user || {};

if (loading) {
return <div>Loading...</div>;
}

return (

<div>
<div className="flex-row mb-3">
<h2 className="bg-dark text-secondary p-3 display-inline-block">
Viewing {user.username}'s profile.
</h2>
</div>

      <div className="flex-row justify-space-between mb-3">
        <div className="col-12 mb-3 col-lg-8">
          <ThoughtList
            thoughts={user.thoughts}
            title={`${user.username}'s thoughts...`}
          />
        </div>

        <div className="col-12 col-lg-3 mb-3">
          <FriendList
            username={user.username}
            friendCount={user.friendCount}
            friends={user.friends}
          />
        </div>
      </div>
    </div>

);
};

export default Profile;

Again to get the profile page to show up we had to remove the ? from the Profile route in App.js.

# 21.5.3

Here we set up the sign up page and login page to access the back end and create a user and return a JWT. First we created the file client/src/utils/mutations.js where we set up our LOGIN_USER and ADD_USER mutations like this.

import { gql } from "@apollo/client";

export const LOGIN_USER = gql` mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token user { _id username } } }`;

export const ADD_USER = gql` mutation addUser($username: String!, $email: String!, $password: String!) { addUser(username: $username, email: $email, password: $password) { token user { _id username } } }`;

Then we went into Signup.js and imported the ADD_USER mutation up top and set it to a const like this.

import { useMutation } from '@apollo/client';
import { ADD_USER } from '../utils/mutations';

const [addUser, { error }] = useMutation(ADD_USER);

Next we updated the handleFormSubmit to talk to the server like this.

/ submit form (notice the async!)
const handleFormSubmit = async event => {
event.preventDefault();

// use try/catch instead of promises to handle errors
try {
// execute addUser mutation and pass in variable data from form
const { data } = await addUser({
variables: { ...formState }
});
console.log(data);
} catch (e) {
console.error(e);
}
};

This uses try...catch to go and talk to the back end to create a user then comeback with the requested information including username, email and token. Lastly we added error handling in the actual JSX return since we have a destructured error in our variable up top. Below the </form> we added this.

{error && <div>Sign up failed</div>}.

Then we went in and did the same thing for the login page.

# 21.5.4

Here we install jwt decode and an auth file in the utils folder that has this.

import decode from "jwt-decode";

class AuthService {
// retrieve data saved in token
getProfile() {
return decode(this.getToken());
}

// check if the user is still logged in
loggedIn() {
// Checks if there is a saved token and it's still valid
const token = this.getToken();
// use type coersion to check if token is NOT undefined and the token is NOT expired
return !!token && !this.isTokenExpired(token);
}

// check if the token has expired
isTokenExpired(token) {
try {
const decoded = decode(token);
if (decoded.exp < Date.now() / 1000) {
return true;
} else {
return false;
}
} catch (err) {
return false;
}
}

// retrieve token from localStorage
getToken() {
// Retrieves the user token from localStorage
return localStorage.getItem("id_token");
}

// set token to localStorage and reload page to homepage
login(idToken) {
// Saves user token to localStorage
localStorage.setItem("id_token", idToken);

    window.location.assign("/");

}

// clear token from localStorage and force logout with reload
logout() {
// Clear user token and profile data from localStorage
localStorage.removeItem("id_token");
// this will reload the page and reset the state of the application
window.location.assign("/");
}
}

export default new AuthService();

This seems very boiler plate and will most likely be used in future projects. Then we updated the Signup.js and the Login.js to include the new Auth and the ability to toss the token into local storage like this.

import Auth from '../utils/auth';

try {
const { data } = await addUser({
variables: { ...formState }
});

Auth.login(data.addUser.token);
} catch (e) {
console.error(e);
}

Finally we went into the app.js to retrieve the token anytime we do we make a request with GraphQL buy first importing it.

import { setContext } from '@apollo/client/link/context';

Then adding this authLink function to grab the token from local storage.

const authLink = setContext((\_, { headers }) => {
const token = localStorage.getItem('id_token');
return {
headers: {
...headers,
authorization: token ? `Bearer ${token}` : '',
},
};
});

Finally updated the client so we can attach the token to the http link like this.

const client = new ApolloClient({
link: authLink.concat(httpLink),
cache: new InMemoryCache(),
});

# 21.5.5

We added the ability to log out. First we went into the Header/index.js component and imported Auth like this.

import Auth from '../../utils/auth';

Then we went into the header function and called the logout function from the Auth file like this.

const logout = event => {
event.preventDefault();
Auth.logout();
};

Finally we went into the return JSX and updated it to render the page based on whether log in is true or false and assigned the logout() to the onClick event for the logout <a>tag.

<nav className="text-center">
  {Auth.loggedIn() ? (
    <>
      <Link to="/profile">Me</Link>
      <a href="/" onClick={logout}>
        Logout
      </a>
    </>
  ) : (
    <>
      <Link to="/login">Login</Link>
      <Link to="/signup">Signup</Link>
    </>
  )}
</nav>

Now we are going to work on loading that Me page.

# 21.5.6

Here we set up the query to look for me. First we got the firends list page to display on the main page if logged in using our basic query. Then we used our full query to diplay the users profile page. A ton of stuff here worth coming back to.

# 21.6.3

Here we created a buttong to add a friend. First we went in to mutations.js to and added this.

export const ADD_FRIEND = gql` mutation addFriend($id: ID!) { addFriend(friendId: $id) { _id username friendCount friends { _id username } } }`;

Next we hung out in Profile.js for a while to hook everyting up. First we imported the ADD_FRIEND mutation up top like this.

import { ADD_FRIEND } from '../utils/mutations';
import { useQuery, useMutation } from '@apollo/client';

Then we dustructured the mutation above the return statement so we can use it in the button like this.

const [addFriend] = useMutation(ADD_FRIEND);

Next we jumped down into the JSX and made it so the button appears on the profile page and called a handlesClick function like this.

<div className="flex-row mb-3">
  <h2 className="bg-dark text-secondary p-3 display-inline-block">
    Viewing {userParam ? `${user.username}'s` : 'your'} profile.
  </h2>

  <button className="btn ml-auto" onClick={handleClick}>
    Add Friend
  </button>
</div>

Then we made the handleClick function above the return statement like this.

const handleClick = async () => {
try {
await addFriend({
variables: { id: user.\_id }
});
} catch (e) {
console.error(e);
}
};

Now this will have the add friend button on every page even our own. So we went back into the JSX one last time to edit the button so that if the useParam gets used then it will display the button like this.

{userParam && (
<button className="btn ml-auto" onClick={handleClick}>
Add Friend
</button>
)}

When we load our own personal page we do not use useParam so as a result the button will hide. Next up is addThought.

# 21.6.4

Here we created the form and then imported it into the Home.js and the Profile.js. First we went into the components folders and created ThoughtForm/inndex.js. In that we initally just put this as a template.

import React, { useState } from 'react';

const ThoughtForm = () => {
return (

<div>
<p className="m-0">
Character Count: 0/280
</p>
<form className="flex-row justify-center justify-space-between-md align-stretch">
<textarea
          placeholder="Here's a new thought..."
          className="form-input col-12 col-md-9"
        ></textarea>
<button className="btn col-12 col-md-3" type="submit">
Submit
</button>
</form>
</div>
);
};

export default ThoughtForm;

Then we went into the Home.js and Profile.js and imported them up top like this.

import ThoughtForm from '../components/ThoughtForm';

Then we snuck this into the Home.js to show only if logged in like this.

{loggedIn && (

<div className="col-12 mb-3">
<ThoughtForm />
</div>
)}

Then in the profile page we added this

<div className="mb-3">{!userParam && <ThoughtForm />}</div>

to the bottom of the JSX above the last div. We did not need to conditionally render it because this page only shows up if logged in. Next we went back into the ThoughtForm to give it some functionality. First we set up these 2 state variable thoughtText and characterCount. Then we added the value of thoughtText to the text area and called the function handlChange. Then we had to make handleChange which lets you type as long as the character count is below 280. Next we added this to the <p> so the can see. Finally we added the handleFormSubmit function to the button and as of now only made it so when we click it the entire form will clear. Everything together looks like this.

import React, { useState } from "react";

const ThoughtForm = () => {
const [thoughtText, setText] = useState("");
const [characterCount, setCharacterCount] = useState(0);

const handleChange = (event) => {
if (event.target.value.length <= 280) {
setText(event.target.value);
setCharacterCount(event.target.value.length);
}
};

const handleFormSubmit = async (event) => {
event.preventDefault();
setText("");
setCharacterCount(0);
};

return (

<div>
<p className={`m-0 ${characterCount === 280 ? "text-error" : ""}`}>
Character Count: {characterCount}/280
</p>
<form
        className="flex-row justify-center justify-space-between-md align-stretch"
        onSubmit={handleFormSubmit}
      >
<textarea
          placeholder="Here's a new thought..."
          value={thoughtText}
          className="form-input col-12 col-md-9"
          onChange={handleChange}
        ></textarea>
<button className="btn col-12 col-md-3" type="submit">
Submit
</button>
</form>
</div>
);
};

export default ThoughtForm;

# 21.6.5

First we went into the mutations and added ADD_THOUGHT like this.

export const ADD_THOUGHT = gql` mutation addThought($thoughtText: String!) { addThought(thoughtText: $thoughtText) { _id thoughtText createdAt username reactionCount reactions { _id } } }`;

Then we hung out in ThoughtForm for a bit. First we imported the ability to add thought and declared in in the function like this.

import { useMutation } from '@apollo/client';
import { ADD_THOUGHT } from '../../utils/mutations';

const [addThought, { error }] = useMutation(ADD_THOUGHT);

Then we upated the handleFormSubmit to do more than just make everything empty like this.

const handleFormSubmit = async event => {
event.preventDefault();

try {
// add thought to database
await addThought({
variables: { thoughtText }
});

    // clear form value
    setText('');
    setCharacterCount(0);

} catch (e) {
console.error(e);
}
};

Finally we went into the <p> and added the ability to display the error like this.

<p className={`m-0 ${characterCount === 280 || error ? 'text-error' : ''}`}>
  Character Count: {characterCount}/280
  {error && <span className="ml-2">Something went wrong...</span>}
</p>

Once that happened we tested the error message which worked fine but the page was not displaying the new thought without a refresh which defeats the purpose of this. So what we had to do wass update the addThought = useMutation from above to inlcue the ability to look at the new thoughts array and query it. Once it did that it wrote the array on the page. We also had to import the QUERY_THOUGHTS. When it is all said it done it looked like this.

import { QUERY_THOUGHTS } from '../../utils/queries';

const [addThought, { error }] = useMutation(ADD_THOUGHT, {
update(cache, { data: { addThought } }) {
// read what's currently in the cache
const { thoughts } = cache.readQuery({ query: QUERY_THOUGHTS });

    // prepend the newest thought to the front of the array
    cache.writeQuery({
      query: QUERY_THOUGHTS,
      data: { thoughts: [addThought, ...thoughts] }
    });

}
});

Once that was in adding from the main page worked yet adding from the profile page did not. It adds to the DB and the homepage but requires a refresh to show up onto the profile page. The main issue is the profile page uses QUERY_ME and not QUERY_THOUGHTS. To fix this we had to import QUERY_ME into the file and then wrap it in a TRY because QUERY_ME relies on QUERY_THOUGHTS TO exsist so if it fails no big deal, it will just try again. The updated code looks like this.

import { QUERY_THOUGHTS, QUERY_ME } from '../../utils/queries';

const [addThought, { error }] = useMutation(ADD_THOUGHT, {
update(cache, { data: { addThought } }) {

      // could potentially not exist yet, so wrap in a try/catch
    try {
      // update me array's cache
      const { me } = cache.readQuery({ query: QUERY_ME });
      cache.writeQuery({
        query: QUERY_ME,
        data: { me: { ...me, thoughts: [...me.thoughts, addThought] } },
      });
    } catch (e) {
      console.warn("First thought insertion by user!")
    }

    // update thought array's cache
    const { thoughts } = cache.readQuery({ query: QUERY_THOUGHTS });
    cache.writeQuery({
      query: QUERY_THOUGHTS,
      data: { thoughts: [addThought, ...thoughts] },
    });

}
});

Next up we will be working on the reaction page.

# 21.6.6

We added the ability to create a reaction. This was very similar to thougths we just had to pass in a thoughtId. The entire ReactionForm compnent looks like this.

import React, { useState } from "react";

import { useMutation } from "@apollo/client";
import { ADD_REACTION } from "../../utils/mutations";

const ReactionForm = ({ thoughtId }) => {
const [reactionBody, setBody] = useState("");
const [characterCount, setCharacterCount] = useState(0);
const [addReaction, { error }] = useMutation(ADD_REACTION);

const handleChange = (event) => {
if (event.target.value.length <= 280) {
setBody(event.target.value);
setCharacterCount(event.target.value.length);
}
};

// submit form
const handleFormSubmit = async (event) => {
event.preventDefault();

    try {
      await addReaction({
        variables: { reactionBody, thoughtId },
      });

      // clear form value
      setBody("");
      setCharacterCount(0);
    } catch (e) {
      console.error(e);
    }

};

return (
<div>
<p
className={`m-0 ${characterCount === 280 || error ? "text-error" : ""}`} >
Character Count: {characterCount}/280
{error && <span className="ml-2">Something went wrong...</span>}
</p>
<form
        className="flex-row justify-center justify-space-between-md align-stretch"
        onSubmit={handleFormSubmit}
      >
<textarea
          placeholder="Leave a reaction to this thought..."
          value={reactionBody}
          className="form-input col-12 col-md-9"
          onChange={handleChange}
        ></textarea>

        <button className="btn col-12 col-md-3" type="submit">
          Submit
        </button>
      </form>
    </div>

);
};

export default ReactionForm;

Then we had to go into mutations and get that going like this.

export const ADD_REACTION = gql` mutation addReaction($thoughtId: ID!, $reactionBody: String!) { addReaction(thoughtId: $thoughtId, reactionBody: $reactionBody) { _id reactionCount reactions { _id reactionBody createdAt username } } }`;

That about sums it up. Next stop Heroku.
