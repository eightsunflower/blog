var express = require('express');
var router = express.Router();
var connection = require('../common/model.js').connection;

/* GET types listing. */
router.get('/', function(req, res, next) {
    connection.query('select count(*) as total from typesapp', function(error, results) {
        if (error) {
            console.log('获取数据失败');
        } else {
            var page = {};
            page.total = results[0].total;
            page.every = 5;
            page.pages = Math.ceil(page.total / page.every);
            page.now = req.query.p ? Number(req.query.p) : 1;
            page.prev = page.now - 1 < 1 ? 1 : page.now - 1;
            page.next = page.now + 1 > page.pages ? page.pages : page.now + 1;
            connection.query('select * from typesapp limit ' + (page.now - 1) * page.every + ',' + page.every, function(error, results, fields) {
                if (error) {
                    console.log('查询失败', error);
                    res.send('服务器内部错误');
                } else {
                    var moment = require('moment');
                    res.render('types/index', { results: results, moment: moment, page: page, admin: req.session.admin });
                }
            })
        }
    })
});
router.get('/insert', function(req, res) {
    res.render('types/insert');
})
router.post('/insert', function(req, res) {
    // req.body.password = require('../common/common.js').md5(req.body.password);
    req.body.addtime = Math.floor(new Date().getTime() / 1000);
    connection.query('insert into typesapp(typesname,addtime) values("' + req.body.typesname + '",' + req.body.addtime + ')', function(error, results, fields) {
        if (error) {
            console.log('失败', error);
            res.redirect('back');
        } else {
            res.redirect('/types');
        }
    });
})

router.post('/ainsert', function(req, res) {
    // req.body.tid = 1;
    req.body.addtime = Math.floor(new Date().getTime() / 1000);

    // 将req.body.content中所有的"替换为\",第二个正则是替换反斜杠
    // req.body.content = req.body.content.replace(/"/g, '\\"').replace(/\\/g, '/');

    connection.query('insert into typesapp(typesname,addtime) values("' + req.body.typesname + '",' + req.body.addtime + ')', function(error, results) {
        if (error) {
            console.log(error);
            res.json({ success: 0 });
        } else {
            console.log(error, results);
            res.json({ success: 1 });
        }
    })
})
router.get('/update/:id', function(req, res) {
    connection.query('select * from typesapp where id=' + req.params.id, function(error, results, fields) {
        if (error) {
            console.log('查询该用户信息失败');
        } else {
            res.render('types/update', { data: results[0] });
        }
    });
})

router.post('/update', function(req, res) {
    console.log(req.body);
    connection.query('update typesapp set typesname="' + req.body.typesname + '" where id=' + req.body.id, function(error, results, fields) {
        if (error) {
            console.log(error);
            res.redirect('back');
        } else {
            res.redirect('/types');
        }
    })
})

router.get('/delete/:id', function(req, res) {
    connection.query('delete from typesapp where id=' + req.params.id, function(error, results, fields) {
        if (error) {
            res.redirect('back');
        } else {
            res.redirect('/types');
        }
    });
})
router.post('/adelete', function(req, res) {
    // console.log(req.body);
    connection.query('delete from typesapp where id = ' + req.body.id, function(error) {
        if (error) {
            // 删除失败
            res.json({ success: 0 });
        } else {
            // 删除成功
            res.json({ success: 1 });
        }
    })
})
// router.get('/image/:id', function(req, res) {
//     res.render('types/image', { id: req.params.id });
// })
var multer = require('multer');
var upload = multer({ dest: 'public/upload' });
router.post('/image', upload.single('photo'), function(req, res) {
    if (req.file.size > 10240000) {
        res.send('文件过大，请重新上传');
    }
    var arr = ['image/png', 'image/gif', 'image/jpeg'];
    if (arr.indexOf(req.file.mimetype) === -1) {
        res.send('上传的文件不符合类型');
    }
    var fs = require('fs');
    var path = require('path');
    var oldname = path.join('public/upload', req.file.filename);
    var filename = req.file.filename + path.extname(req.file.originalname);
    var newname = path.join('public/upload', filename);
    fs.rename(oldname, newname, function(error) {
        if (error) {
            console.log('修改失败', error);
        } else {
            connection.query('update typesapp set photo="' + filename + '" where id=' + req.body.id, function(error) {
                if (error) {
                    console.log('修改用户头像数据失败');
                } else {
                    res.redirect('/types');
                }
            })
        }
    })
})

module.exports = router;