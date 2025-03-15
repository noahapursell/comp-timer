FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE ${PORT}

CMD ["npm", "start"]