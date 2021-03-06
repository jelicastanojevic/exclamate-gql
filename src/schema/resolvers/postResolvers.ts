import { ApolloError } from 'apollo-server-express';
import { getManager, In } from 'typeorm';

import { Comment } from '../../entity/Comment';
import { Post } from '../../entity/Post';
import { User } from '../../entity/User';
import { Resolvers } from '../../generated/graphql';

// const logger = getLogger('postResolvers.ts');

export const resolvers: Resolvers = {
  Post: {
    // TODO Check if this is needed because there is join on getPost query
    comments: (post) => Comment.find({ where: { postId: post.id }, relations: ['user'] }),
    // TODO Check if this can be achieved in query builder
    likes: async (post) => {
      const numberOfLikes = await getManager().query(
        `select COUNT(DISTINCT l.userId) as likes from post p 
                    left join \`like\` l on p.postId = l.postId 
                  where l.postId = ${post.id};`,
      );
      return parseInt(numberOfLikes[0].likes, 10);
    },
  },
  Query: {
    getPost: async (_, { id }) => {
      // logger.debug('**************');
      // //@ts-ignore
      // // logger.debug(info.fieldNodes[0].selectionSet.selections);
      // //@ts-ignore
      // info.fieldNodes[0].selectionSet.selections.forEach((el, index) => {
      //   logger.debug(`index: ${index}`);
      //   logger.debug(el);
      // });
      // logger.debug('**************');

      const post = await Post.findOne({
        where: { id },
        relations: ['comments'],
      });
      return post ? post : null;
    },
    getPosts: async (_, { offset, limit }, { user }) => {
      const whereConditions: any = [{ user }];
      const userWithFollowings = await User.findOne(user.id, {
        relations: ['followings'],
      });

      if (userWithFollowings && userWithFollowings.followings.length !== 0) {
        whereConditions.push({
          user: In([user.id, ...userWithFollowings.followings.map((e) => e.id)]),
        });
      }

      return await Post.find({
        where: whereConditions,
        relations: ['comments'],
        order: {
          created: 'DESC',
          id: 'ASC',
        },
        skip: offset ? offset : 0,
        take: limit ? limit : 10,
      });
    },
  },
  Mutation: {
    createPost: async (_, { body }, { user }) => {
      return await Post.create({ body, user }).save();
    },
    deletePost: (_, { postId }) => {
      return Post.findOne(postId).then((post) => {
        if (post) {
          return post.remove().then(() => true);
        }
        return false;
      });
    },
    editPost: async (_, { postId, body }) => {
      const post = await Post.findOne(postId);

      if (post) {
        post.body = body.trim();
        await post.save();
        return post;
      } else {
        throw new ApolloError('Post not edited');
      }
    },
  },
};
