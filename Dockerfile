FROM node:latest
COPY package.json .
RUN npm install
RUN apt-get update
COPY index.js .
COPY .env .
CMD ["node" , "index.js"]