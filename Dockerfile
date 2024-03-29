FROM almalinux:8

RUN groupadd -g 1000 albs && \
    useradd -u 1000 -g 1000 albs && \
    curl https://nodejs.org/dist/v16.20.1/node-v16.20.1-linux-x64.tar.gz -o /root/node.tar.gz && \
    cd /usr/local && \
    tar --strip-components 1 -xzf /root/node.tar.gz

RUN npm install -g -y @quasar/cli

USER albs
WORKDIR /home/albs/code
# CMD ["/bin/bash"]
CMD ["npm", "run", "build"]
# docker run --rm -it -v $(pwd):/code -p 8080:8080 7ce58f1d59e9
