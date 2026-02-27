FROM node:25

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate


EXPOSE  5000
CMD ["npm","run","dev"]
