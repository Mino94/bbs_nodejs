var express = require('express');
var app = express.Router();

// DB
var db_config = require('../config/database');
var conn = db_config.init();

var session = require('express-session'); // npm install express-session
// session
app.use(session({
    secret: 'keyboard cat',     // 암호화
    resave: false,
    saveUninitialized: true    
}));

// parameter를 받기 위한 설정
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded( {extended:true} ));

app.get('/login', function(req, res){
    console.log('login 접속 성공!');

    res.render('login.html');
});

app.get('/regi', function(req, res){
    console.log('regi 접속 성공!');

    res.render('regi.html');
})

app.post('/checkId', function(req, res){
    console.log("checkId 접속 성공!");
    console.log(req.body.id);
    
    var sql = "SELECT COUNT(*) as cnt FROM MEMBER WHERE ID=? ";
    var param = [req.body.id];

    conn.query(sql, param, function(err, result, fields){
        if(err) console.log(err);

        console.log("결과:" + JSON.stringify(result));

        if(result[0].cnt == 0){
            res.send({result:'OK'});
        }else{
            res.send({result:'NO'});
        }
    })
})

app.post('/regiAf', function(req, res){
    console.log("regiAf 접속 성공!");
    var id = req.body.id;
    var pwd = req.body.pwd;
    var name = req.body.name;
    var email = req.body.email;

    var sql = 'INSERT INTO MEMBER(ID, PWD, NAME, EMAIL, AUTH) VALUES(?, ?, ?, ?, 3)';
    var params = [id, pwd, name, email];

    conn.query(sql, params, function(err, result) {
        if(err) console.log('query is not excuted. insert fail\n' + err);
        
        console.log(JSON.stringify(result));
        
        if(result.affectedRows > 0){
            console.log('추가 성공!');
            res.render('message.ejs', {proc:"regi", msg:"OK"});
        }else{
            console.log('추가 실패~');
            res.render('message.ejs', {proc:"regi", msg:"NG"});
        }        
    });
})

app.post('/loginAf',function(req,res){
    console.log("/loginAf 접속 성공!");  

    var id = req.body.id;
    var pwd = req.body.pwd;

    console.log("id:" + id);
    console.log("pwd:" + pwd);

    var sql = "select id, name, email from member where id=? and pwd=?";
    var params = [id, pwd];
    conn.query(sql, params, function (err, results, fields) {
        if(err) console.log("에러 발생!!", err);

        console.log("결과:" + JSON.stringify(results));
        console.log(results.length);

        if(results.length > 0){
            console.log(results[0].id);
            
            // session
            // id만 저정하고 싶을 경우
            //req.session.user_id = results[0].id;
            // 회원정보를 저장하고 싶은 경우
            req.session.member = results[0];

            console.log("req.session.member:" + req.session.member);
            console.log(req.session.member.name);
            
            res.render('message.ejs', {proc:"login", msg:"OK"});
        }else{            
            res.render('message.ejs', {proc:"login", msg:"NG"});
        }        
    }); 
});


module.exports = app;
