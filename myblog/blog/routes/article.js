var express = require('express');
var router = express.Router();
var connection = require('../common/model.js').connection;

/* GET article listing. */
router.get('/', function(req, res, next) {
    connection.query('select count(*) as total from articleapp', function(error, results) {
        if (error) {
            console.log('获取数据失败', error);
        } else {
            var page = {};
            page.total = results[0].total;
            page.every = 5;
            page.pages = Math.ceil(page.total / page.every);
            page.now = req.query.p ? Number(req.query.p) : 1;
            page.prev = page.now - 1 < 1 ? 1 : page.now - 1;
            page.next = page.now + 1 > page.pages ? page.pages : page.now + 1;
            connection.query('select typesapp.typesname,articleapp.* from typesapp,articleapp where articleapp.tid = typesapp.id order by articleapp.id desc limit ' + (page.now - 1) * page.every + ',' + page.every, function(error, results, fields) {
                if (error) {
                    console.log('查询失败', error);
                    res.send('服务器内部错误');
                } else {
                    connection.query('select * from typesapp', function(error, results1) {
                        if (error) {
                            console.log('失败', error);
                        } else {

                            var moment = require('moment');
                            res.render('article/index', { results: results, moment: moment, page: page, admin: req.session.admin, results1: results1 });
                        }
                    })
                }
            })
        }
    })
})
// router.get('/', function(req, res) {
//     connection.query('select typesapp.typesname,articleapp.* from typesapp,articleapp where articleapp.tid = typesapp.id', function(error, results) {
//         if (error) {
//             console.log('查询失败', error);
//         } else {
//             // console.log(results);
//             res.render('article/index', { results: results, moment: require('moment') });
//         }
//     })
// })

router.get('/insert', function(req, res) {
    connection.query('select * from typesapp', function(error, results) {
        if (error) {
            console.log('查询数据失败', error);
        } else {

            res.render('article/insert', { results: results });
        }
    })
})
router.post('/insert', function(req, res) {
    req.body.content = req.body.content.replace(/"/g, '\\"').replace(/\\/g, '/');
    // req.body.password = require('../common/common.js').md5(req.body.password);

    req.body.addtime = Math.floor(new Date().getTime() / 1000);
    connection.query('insert into articleapp(tid,title,author,content,addtime) values(' + req.body.tid + ',"' + req.body.title + '","' + req.body.author + '","' + req.body.content + '",' + req.body.addtime + ')', function(error, results, fields) {
        if (error) {
            console.log('失败', error);
            res.redirect('back');
        } else {
            res.redirect('/article');
        }
    });
})

// 执行添加操作
router.post('/ainsert', function(req, res) {
    // req.body.tid = 1;
    req.body.addtime = Math.floor(new Date().getTime() / 1000);
    req.body.content = req.body.content.replace(/"/g, '\\"').replace(/\\/g, '/');

    connection.query('insert into articleapp(tid,title,content,addtime) values(' + req.body.tid + ',"' + req.body.title + '","' + req.body.content + '",' + req.body.addtime + ')', function(error, results) {
        if (error) {
            console.log(error);
            res.json({ success: 0 });
        } else {
            connection.query('select typesapp.typesname,articleapp.* from typesapp,articleapp where articleapp.tid = typesapp.id and articleapp.id = ' + results.insertId, function(error, results1) {
                if (error) {
                    console.log('查询失败', error);
                } else {
                    var data = results1[0];
                    data.addtime = require('moment').unix(data.addtime).format('YYYY-MM-DD HH:mm:ss');
                    res.json({ success: 1, data: data });
                }
            })
        }
    })
})

router.get('/update/:id', function(req, res) {
    connection.query('select * from articleapp where id=' + req.params.id, function(error, results, fields) {
        // console.log(results)
        if (error) {
            console.log('查询该用户信息失败');
        } else {
            connection.query('select * from typesapp', function(error2, results2) {
                if (error2) {
                    console.log('查询失败');
                } else {

                    res.render('article/update', { data: results[0], results2: results2 });
                }
            })
        }
    });
})

router.post('/update', function(req, res) {
    req.body.content = req.body.content.replace(/"/g, '\\"').replace(/\\/g, '/');
    console.log(req.body);
    connection.query('update articleapp set title="' + req.body.title + '",content="' + req.body.content + '",tid="' + req.body.tid + '",author="' + req.body.author + '" where id=' + req.body.id, function(error, results, fields) {
        if (error) {
            console.log(error);
            res.redirect('back');
        } else {
            res.redirect('/article');
        }
    })
})


router.post('/delete', function(req, res) {
    // console.log(req.body);
    connection.query('delete from articleapp where id = ' + req.body.id, function(error) {
        if (error) {
            // 删除失败
            res.json({ success: 0 });
        } else {
            // 删除成功
            res.json({ success: 1 });
        }
    })
})

module.exports = router;