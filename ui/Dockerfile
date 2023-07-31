FROM node:16
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3333
CMD [ "npm", "start" ]
