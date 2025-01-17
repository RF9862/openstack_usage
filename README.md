# TEST_openstack
Image Analysis web application
Backend - FastApi
Frontend - React
## Environment Setup

### Use scripts
1. double click the start.sh file. This will download, build and run both the back-end and front-end.
2. To stop, press CTRL-C in the terminal that opened when you started the start.sh script, or close the terminal.
3. double click the stop.sh script. This will stop the back-end services.

If for some reason start.sh is not working it could be because a container or volume got corrupted.
Please run the reset.sh script and once that has finished running you can run start.sh again.

### Use docker compose
- Run the following command in the TEST_openstack folder to start all backend services
  ```sh
  # If this is the first time running this command it will take some time while the docker images are downloaded.
  # Future uses will be very fast.
  $ docker compose up
  ``` ( *** On ubuntu - use : docker-compose build, docker-compse up -d)
- To start a development version of the front end, please input the following commands.
  ```sh
  $ cd react
  $ cp -a .dummy.env .env
  
  # this will install all modules and could take some time (case: npm -v < 9.0.0)
  $ npm install 

  # (case: npm -v >= 9.0.0)
  $ npm install --legacy-peer-deps
  
  # this will build and serve the project.
  $ npm start 
  ```
- [http://localhost:3000/]() to see the frontend


- [http://localhost:8000/docs]() to see the backend documentation


- [http://localhost:8081/devDB/]() to see the database (mongo-express)

### Monitoring
To monitor the celery worker tasks / microservices. Go to [http://localhost:5555/]()
To monitor RabbitMQ, the message broker. Go to [http://localhost:15672/]()
And enter the username and password set in the celery_task.env file in ./env_files.
Default: 
- User: 'user'
- Password: 'password'

---
### Explanation about backend
- The backend was configurated as docker container
1. mainApi is fastAPI framework backend to provider api to the frontend ( TEST_openstack-react-mainapi)
2. Database docker container ( mongo )
3. Backend database server container ( mongo-express )
 ```
 Basic Auth
 URL: [http://localhost:8081/devDB/]()
 username: user
 password: #C2Y8YqvV
 Please change env_files/mongo-express.env if you don't want to enter user and password.
 ```
4. Others are image processing module working as docker container.
So main point is to install docker environment as perfectly to prepare development environment.
- Backend Development Environment
Because the backend was configurated docker system. the development should be docker devcontainer.
For example - vscode docker environment (Remote Containers)
### Explanation about frontend
- The frontend was configurated with react.js
The gole is Viv viewer to display every images on frontend by using backend that customize image processing using ashlar python module.

- Detail Explanation about Frontend project structure and Data system.
 Main Page file is MainFrame.js 
 Descibe full page of the frontend and most skeleton was configured on this file , Should touch carefully and understand as fully.
 There are three parts called - left panel area, central panel area, right panel area
 1. Left Panel part + Right Panel Part
    Both parts are existed in /src/components/tabs
 2. Central Panel 
    Are existed in /src/viv/
    * This is important part in this project. 

*** This project structure is configured as perfectly and as well for image processing and viv viewer.

### About some issues in deploying

In special case, some files need to get access to run as admin in ubuntu server.
(mainApi/ml_lib/segA,segAB,segB files)
So for successful running, should run the following
...For example...
sudo su
chmod +777 segAB
