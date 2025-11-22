FROM node:16

WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Run the postinstall script explicitly if needed, though npm install should handle it
# RUN npm run postinstall

EXPOSE 3000

CMD ["node", "app.js"]