  FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN chown -R node:node /usr/src/app

RUN npm install -g yarn
RUN yarn


EXPOSE 3000
CMD ["node", "app.js"]