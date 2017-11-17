var express = require('express');
var router = express.Router();
var connection = require('../common/model.js').connection;

/* GET home page. */
router.get('/', function(req, res, next) {
    var where = '';
    var param = '';
    if (req.query.tid) {
        where = ' where tid=' + req.query.tid;
        param = '&tid=' + req.query.tid;
    }

    // 查询文章
    connection.query('select count(*) as total from articleapp' + where, function(error, results0) {
        if (error) {
            console.log('查询失败', error);
        } else {
            // 查询分类
            var page = {};
            page.total = results0[0].total;
            page.every = 5;
            page.pages = Math.ceil(page.total / page.every);
            page.now = req.query.p ? Number(req.query.p) : 1;
            page.prev = page.now - 1 < 1 ? 1 : page.now - 1;
            page.next = page.now + 1 > page.pages ? page.pages : page.now + 1;
            connection.query('select * from articleapp ' + where + ' limit ' + (page.now - 1) * page.every + ',' + page.every, function(error, results, fields) {
                if (error) {
                    console.log('查询失败', error);
                    res.send('服务器内部错误');
                } else {
                    connection.query('select * from typesapp', function(err, results1) {
                        if (err) {
                            console.log('查询失败', error);
                        } else {
                            var moment = require('moment');
                            res.render('index', { results: results, moment: moment, page: page, admin: req.session.admin, results1: results1, param: param });
                        }
                    })
                }
            })
        }

    });
});



router.get('/show/:id', function(req, res) {
    connection.query('select * from articleapp where id = ' + req.params.id, function(error, results) {
        if (error) {
            console.log('查询失败', error);
        } else {
            res.render('show', { data: results[0], moment: require('moment') });
        }
    })
})
router.get('/list', function(req, res) {
    res.render('list');
})
router.get('/reg', function(req, res) {
    res.render('reg');
})
router.post('/reg', function(req, res) {
    if (Number(req.body.code) === req.session.code) {

        req.body.password = require('../common/common.js').md5(req.body.password);
        req.body.addtime = Math.floor(new Date().getTime() / 1000);
        connection.query('insert into usersapp(username,password,phone,addtime) values("' + req.body.username + '","' + req.body.password + '","' + req.body.phone + '",' + req.body.addtime + ')', function(error) {
            if (error) {
                console.log('添加失败', error);
            } else {
                res.redirect('/login');
            }
        })
    } else {
        res.redirect('back');
    }
})
router.get('/login', function(req, res) {
    res.render('login', { error: req.flash('error').toString() });
})
router.post('/login', function(req, res) {
    req.body.password = require('../common/common.js').md5(req.body.password);
    connection.query('select * from usersapp where username="' + req.body.username + '" and password="' + req.body.password + '"', function(error, results) {
        if (error) {
            console.log('查询失败', error);
        } else {
            if (results.length === 0) {
                req.flash('error', '用户名和密码匹配错误');
                res.redirect('back');
            } else {
                req.session.admin = results[0];
                res.redirect('/users');
            }
        }
    })
})
router.post('/check', function(req, res) {
    connection.query('select * from usersapp where username="' + req.body.username + '"', function(error, results) {
        if (error) {
            console.log('查询数据失败');
        } else {
            if (results.length === 1) {
                res.json({ "success": 1, "more": ['zhangsan123', '12zhangsan', 'zhangsan789'] })
            } else {
                res.json({ "success": 0 });
            }
        }
    })
})
router.post('/msg', function(req, res) {
    function rand(m, n) {
        return Math.floor(Math.random() * (n - m + 1) + m);
    }
    var code = rand(1000, 9999);
    req.session.code = code;
    TopClient = require('../common/alidayu/topClient.js').TopClient;
    var client = new TopClient({    
        'appkey': '23341634',
            'appsecret': '7e30a1c2c254c9a109f283067e8d5e18',
            'REST_URL': 'http://gw.api.taobao.com/router/rest'
    }); 
    client.execute('alibaba.aliqin.fc.sms.num.send', {    
        'extend': '123456',
            'sms_type': 'normal',
            'sms_free_sign_name': '俊哥技术小站',
            'sms_param': '{\"code\":\"' + code + '\"}',
            'rec_num': req.body.phone,
            'sms_template_code': 'SMS_105890028'
    }, function(error, response) {    
        if (error) {
            res.json({ success: 0 });
        } else {
            res.json({ success: 1 });
        }
    })
})
router.get('/logout', function(req, res) {
    req.session.admin = null;
    res.redirect('/login');
})

// 引入multer文件上传模块
var multer = require('multer');
var upload = multer({
    dest: 'public/upload/articles'
})

// 专门处理文章文件上传
router.post('/upload', upload.single('editormd-image-file'), function(req, res) {
    // 给文件设置后缀名
    var fs = require('fs');
    var path = require('path');

    // 拼接老名字和新名字，使用rename进行改名
    var oldname = path.join('public/upload/articles', req.file.filename);
    // 补充文件的后缀名
    var filename = req.file.filename + path.extname(req.file.originalname);
    var newname = path.join('public/upload/articles', filename);

    fs.rename(oldname, newname, function(error) {
        if (error) {
            res.json({ success: 0, message: '上传失败', url: '' });
        } else {
            var newpath = path.join('/upload/articles', filename);
            res.json({ success: 1, message: '上传成功', url: newpath })
        }
    })
})

module.exports = router;