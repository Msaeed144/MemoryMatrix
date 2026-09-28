FROM nginx:1.27-alpine

# Bake frontend into the image so the server does not depend on bind mounts
# (missing mounts on the host often cause 403 Forbidden on port 1234).

RUN rm -rf /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html styles.css landing.js /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
COPY vendor /usr/share/nginx/html/vendor
COPY assets /usr/share/nginx/html/assets
COPY memory-matrix /usr/share/nginx/html/memory-matrix
COPY on-click /usr/share/nginx/html/on-click

# Ensure nginx can read everything
RUN chmod -R a+rX /usr/share/nginx/html

EXPOSE 80
