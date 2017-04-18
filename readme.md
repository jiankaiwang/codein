# codein

Codein is a cross-platform swift IDE based on docker. 

CodeIn provides you a well solution to swift programming. It not only  runs without internet and installation, but also provides you cloud storage API. All you need is play with the swift.

CodeIn is a web-based Swift IDE and was developed under PHP 7.0 and Apache 2. It provides you an intuitional and simplifed coding interface. Furthermore, a dropbox and gist api were also embedded to provide you a easy way sharing with the other.

[![Codein Operation](https://img.youtube.com/vi/HypbQUUAUBc/0.jpg)](http://www.youtube.com/watch?v=HypbQUUAUBc "CodeIn")

## Docker

Docker provides lite, high-performance and cross platform 


## Programming IDE Framework

In detail, codein not only provides you a swift IDE, but also is the IDE framework for multiple kinds of programming languages. The idea of Codein architecture is composed of frontend user iterface and backend execution with access to API.

Like other web-IDE, Codein IDE framework and coding iterface are also built on several 3rd party open source, including `jquery`, `bootstrap`, `font-awesome`, `ace` and `base64`. The whole 3rd party resource is located on directory `resource`.

`Dropbox Storage API` and `Github gist API` are also embedded into Codein. The source code of these APIs is developed by `PHP` language and is located under the directory `api`.

The connection between frontend interface and backend execution /w API access is also the API by the CRUD method in json format. 

* The resource in frontend interface is `general.js` located on directory `resource`. 

* The resource of backend execution is `exec.php` located on directory `api`.

* The resources of backend access API to dropbox and github gist are `DropboxAPI.php` and `GistAPI.php`. They both use another open source `CRUD.php` to access the Dropbox and Github service. All of the above is located on directory `api`.

