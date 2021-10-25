System overview
--- 

AlmaLinux Build System Frontend is designed to display the web UI of the Build System. ALBS Frontend has some functional features that help to work with the Build System: a user can choose what data to show and what data to send back to Web-Server. 
Frontend is written on `vue 3` and `quasar 2`.

Mentioned tools and libraries are required for ALBS Frontend to run in the current state:
- node==v12.22.1 


Install the dependencies 
---

The following command installs all the needed packages as dependencies for Frontend to make sure it works as it must.

```
npm install 
```


Start the app in development mode (hot-code reloading, error reporting, etc.)
---

The following command makes a development environment by putting all the files together and displaying how it looks on the host. If there are some changes in files, this command will rebuild and update the design immediately.
 
```
quasar dev
```


Lint the files
---

The following command is lint or linter. That is a tool to look through the code for programming errors, bugs, security issues, etc. So this command checks all the Frontend's files to see if there are any mistakes or complications. 

```
npm run lint
```


Build the app for production
---
The following command works almost like `quasar dev`, but this one doesn't update the Build System's design face in case of changes. If the update is needed, a user has to do it manually by himself.

```
quasar build
```


Customize the configuration
---

See [Configuring quasar.conf.js](https://v2.quasar.dev/quasar-cli/quasar-conf-js).


Running docker-compose 
---

ALBS Frontend doesn't have its own `docker-compose.yml` file. So if you want to run Frontend, consider using the `docker-compose.yml` file from [ALBS Web-Server](https://github.com/AlmaLinux/albs-web-server).


Reporting issues 
---
All issues should be reported to the [Build System project](https://github.com/AlmaLinux/build-system).