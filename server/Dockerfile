FROM nginx:alpine

# ลบ default config
RUN rm -f /etc/nginx/conf.d/default.conf

# ใส่ nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# เอา dist ที่ build แล้วไป serve
# COPY dist /usr/share/nginx/html/drugnarco/

EXPOSE 8081
CMD ["nginx", "-g", "daemon off;"]
