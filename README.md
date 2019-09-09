# pedirpizzas-serverless
Basic serverless project with comments of the code. I take one udemy tutorial and this is the lab task.

Intall:
```
$ npm install serverless -g
$ npm install
```

Serverless commands:
```
$ sls login # login in serverless to deploy, only the first time
$ sls deploy
```

To execute a especific function:
```
$ serverless invoke -f FUNCTION_NAME -r us-west-1 -d {}
```

For delete the AWS resource:
```
$ serverless remove --stage dev --region us-west-1
```

To see the logs in AWS:

```
$ sls logs -f FUNCTION_NAME -t # the t is for tail.
```
