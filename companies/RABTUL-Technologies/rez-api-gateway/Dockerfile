FROM nginx:1.27-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf

# Copy our template (env vars will be substituted at runtime)
COPY nginx.conf /etc/nginx/nginx.conf.template
COPY start.sh /start.sh
RUN sed -i 's/\r$//' /start.sh && chmod +x /start.sh

# Render requires the container to listen on $PORT (default 10000)
EXPOSE 10000

CMD ["/start.sh"]
