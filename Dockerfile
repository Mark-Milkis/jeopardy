FROM node:8

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .
RUN chown -R node:node /usr/src/app

# RUN npm install -g yarn
RUN yarn

RUN npm install -g bower
RUN bower install


EXPOSE 3000
CMD ["node", "app.js"]