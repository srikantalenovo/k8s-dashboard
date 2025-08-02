# k8s-dashboard
.
└── k8s-dashboard
    ├── README.md
    ├── backend
    │   ├── Dockerfile
    │   ├── config
    │   │   ├── config
    │   │   └── kubeconfig.js
    │   ├── package-lock.json
    │   ├── package.json
    │   └── src
    │       ├── app.js
    │       ├── controllers
    │       │   ├── admin.controller.js
    │       │   ├── auth.controller.js
    │       │   └── k8s.controller.js
    │       ├── middleware
    │       │   ├── auth.js
    │       │   ├── authenticate.js
    │       │   ├── errorHandler.js
    │       │   ├── rbac.js
    │       │   ├── validate.js
    │       │   └── validate.js-bkp
    │       ├── migrations
    │       │   └── bkp-migrations-create-users.js
    │       ├── models
    │       │   ├── index.js
    │       │   ├── naa-user.model.j
    │       │   └── user.model.js
    │       ├── routes
    │       │   ├── admin.routes.js
    │       │   ├── auth.routes.js
    │       │   ├── db.routes.js
    │       │   ├── k8s.routes.js
    │       │   └── k8s.routes.js-bkp
    │       ├── server.js
    │       ├── services
    │       │   └── k8s.service.js
    │       ├── utils
    │       │   ├── database.js
    │       │   ├── errors.js
    │       │   └── logger.js
    │       └── validations
    │           └── auth.validation.js
    ├── config
    ├── database
    │   ├── Dockerfile
    │   └── init.sql
    ├── docker-compose.yml
    └── frontend
        ├── Dockerfile
        ├── README.md
        ├── config
        ├── nginx.conf
        ├── package-lock.json
        ├── package.json
        ├── public
        │   ├── favicon.ico
        │   ├── index.html
        │   ├── logo192.png
        │   ├── logo512.png
        │   ├── manifest.json
        │   └── robots.txt
        └── src
            ├── App.css
            ├── App.js
            ├── App.js-bkp
            ├── App.test.js
            ├── ProtectedRoute.js
            ├── Routes.js
            ├── Routes.js-bkp
            ├── components
            │   ├── ClusterHealth.js
            │   ├── DatabaseStatus.js
            │   ├── K8sResourceTable.js
            │   ├── NodeStatus.js
            │   └── ProtectedRoute.js
            ├── context
            │   ├── AuthContext.js
            │   └── AuthContext.js-bkp
            ├── hooks
            │   ├── useK8sData.js
            │   └── useK8sData.js-bkp
            ├── index.css
            ├── index.js
            ├── logo.svg
            ├── pages
            │   ├── Dashboard.js
            │   ├── Dashboard.js-bkp
            │   ├── Login.js
            │   ├── Login.js-bkp
            │   ├── Resources.js
            │   ├── Signup.js
            │   └── react-circular-progressbar.js
            ├── reportWebVitals.js
            ├── services
            │   └── api.js
            └── setupTests.js
