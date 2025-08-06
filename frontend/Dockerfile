FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./

RUN npm install react-circular-progressbar @mui/icons-material framer-motion react-chartjs-2 chart.js lucide-react

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html

RUN mkdir -p /root/.kube

COPY config  /root/.kube/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
