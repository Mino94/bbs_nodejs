var express = require('express');
var app = express.Router();

// DB
var db_config = require('../config/database');
var conn = db_config.init();

// parameter를 받기 위한 설정
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded( {extended:true} ));

app.get("/bbswrite", function(req, res){
    console.log('bbswrite 접속 성공!');
    console.log("req.session.member.id:" + req.session.member.id);

    res.render("../views/bbswrite.html", {user:req.session.member.id});
});

app.post("/bbswriteAf", function(req, res){
    console.log('bbswriteAf 접속 성공!');
    console.log(req.body);
    
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;

    var sql =  " INSERT INTO BBS(ID, REF, STEP, DEPTH, TITLE, CONTENT, WDATE, DEL, READCOUNT) "
            +  " VALUES(?, (SELECT IFNULL(MAX(REF), 0)+1 FROM BBS a), 0, 0, " 
            +  "      ?, ?, NOW(), 0, 0) ";

    var params = [id, title, content];

    conn.query(sql, params, function(err, results){
        if(err) console.log('query error'+ err);

        console.log("result:" + results);
        console.log("추가 success");
        
        if(results != 'undefined'){
            res.render('message.ejs', {proc:"insertBbs", msg:"OK"});
        }else{
            res.render('message.ejs', {proc:"insertBbs", msg:"NO"});
        }
     })
});
// update
app.get("/updateBbs", function(req, res){
    console.log("수정 게시판 접속");
    var seq = req.query.seq;
    console.log(seq);
    res.render("../views/bbsupdate.html", {
        user:req.session.member.id,
        seq:seq,
    });
});

app.post("/updateBbsAf", function(req, res){
    var seq = req.body.seq;
    var title = req.body.title;
    var content = req.body.content;

    console.log(seq);
    var sql = " UPDATE BBS " 
            + " SET TITLE = ?, CONTENT = ?, WDATE = NOW() "
            + " WHERE SEQ = ? ";
    console.log(sql);
    var params = [title, content, seq];
    conn.query(sql, params, function(err, updresults){
        if(err) console.log(err);

        console.log(JSON.stringify(updresults));

        if(updresults.affectedRows == 1){
            res.render('message.ejs', {proc:"updbbs", msg:"OK"});
        }else{
            res.render('message.ejs', {proc:"updbbs", msg:"NO"});
        }
    });
});

app.get("/deleteBbs", function(req, res){
    var seq = req.query.seq;
    console.log(seq);
    var sql = " UPDATE BBS "
                + " SET DEL = ?, WDATE = NOW() "
                + " WHERE SEQ = ? ";
    var params = [1, seq];
    conn.query(sql, params, function(err, delresults){
        if(err) console.log(err);

        console.log(JSON.stringify(delresults));

        if(delresults.affectedRows == 1){
            res.render('message.ejs', {proc:"delbbs", msg:"OK"});
        }else{
            res.render('message.ejs', {proc:"delbbs", msg:"NO"});
        }
    });
});

app.get("/bbsdetail", function(req, res){
    var seq = req.query.seq;
    console.log(seq);
    var sql = " SELECT SEQ, ID, REF, STEP, DEPTH, TITLE, CONTENT, WDATE, DEL, READCOUNT " + " FROM BBS "
            + " WHERE SEQ = "+ seq;

    conn.query(sql, function(err, results){
        if(err) console.log(err);

        console.log(JSON.stringify(results[0]));

        res.render('bbsdetail.ejs', {
            user:req.session.member.id,
            data:results[0]
        });
    });
});

app.get("/bbslist", function(req, res){
    console.log("bbslist"); 
    console.log("req.session.member.id:" + req.session.member.id);

    var choice = req.query.choice;
    var search = req.query.search;
    var pageNumber = req.query.pageNumber;

    if(pageNumber == undefined) pageNumber = 1;  

    // 총 글의 갯수
    var totalCount = 0;
    var sql = " SELECT IFNULL(COUNT(*), 0) as cnt "
            + " FROM BBS ";
    var sqlWord = "";
    if(choice == "title"){
        sqlWord = " WHERE TITLE LIKE '%" + search + "%' ";
    }else if(choice == "content"){
        sqlWord = " WHERE CONTENT LIKE '%" + search + "%' ";
    }else if(choice == "writer"){
        sqlWord = " WHERE ID='" + search + "' ";
    }    
    sql += sqlWord;
    // console.log("sql:" + sql);

    conn.query(sql, function(err, result){
        console.log( result[0].cnt );
        totalCount = result[0].cnt;
    });

    // 페이지 계산
    var sn = pageNumber - 1;    // 0 1 2
    var start = sn * 10 + 1;    // 1    11  
    var end = (sn + 1) * 10;    // 10   20

    sql = " SELECT SEQ, ID, REF, STEP, DEPTH, "
        + "        TITLE, CONTENT, WDATE, DEL, READCOUNT "
        + " FROM ";

    sql += "    (SELECT ROW_NUMBER()OVER(ORDER BY REF DESC, STEP ASC) AS RNUM, "
         + "            SEQ, ID, REF, STEP, DEPTH, " 
         + "            TITLE, CONTENT, WDATE, DEL, READCOUNT "     
         + "     FROM BBS ";
    
    sqlWord = "";
    if(choice == "title"){
        sqlWord = " WHERE TITLE LIKE '%" + search + "%' ";
    }else if(choice == "content"){
        sqlWord = " WHERE CONTENT LIKE '%" + search + "%' ";
    }else if(choice == "writer"){
        sqlWord = " WHERE ID='" + search + "' ";
    }
    sql += sqlWord;

    sql += "     ORDER BY REF DESC, STEP ASC) a ";
    sql += " WHERE RNUM BETWEEN " + start + " AND " + end;

    conn.query(sql, function(err, results){
        if(err) console.log(err);

        // console.log(JSON.stringify(results));

        res.render('bbslist.ejs', {
            user:req.session.member.id,
            data:results,
            choice:choice,
            search:search,
            totalCount:totalCount,
            pageNumber:pageNumber
        })

    });
});

app.get("/answer", function(req, res){
    console.log("답글 게시판 접속");
    var seq = req.query.seq;
    console.log(seq);
    res.render("../views/answer.html", {
        user:req.session.member.id,
        seq:seq,
    });
});

app.post("/answerAf", function(req, res){
    console.log("answerAf 접속");
    console.log(req.body)

    var seq = req.body.seq;
    var id = req.body.id;
    var title = req.body.title;
    var content = req.body.content;

    // update
    var sql1 = " UPDATE BBS " + " SET STEP=STEP+1 "
        + " WHERE REF=(SELECT REF FROM (SELECT REF FROM BBS a WHERE SEQ=?) A ) "
        + " AND STEP>(SELECT STEP FROM (SELECT STEP FROM BBS b WHERE SEQ=?) B ) ";

    param1 = [seq, seq];
    conn.query(sql1, param1, function(err, results1){
            if(err) console.log(err);
            
            console.log(JSON.stringify(results1));
            
            if(results1.affectedRows == 0){
                res.render('message.ejs', {proc:"answer1", msg:"OK"});
            }else{
                res.render('message.ejs', {proc:"answer1", msg:"NO"});
            }
    });

    // insert
    var sql2 = " INSERT INTO BBS(ID, REF, STEP, DEPTH, TITLE, CONTENT, WDATE, DEL, READCOUNT) "
            + "  VALUES (?, (SELECT REF FROM BBS a WHERE SEQ=?), (SELECT STEP FROM BBS b WHERE SEQ=?)+1, "
            + "  (SELECT DEPTH FROM BBS a WHERE SEQ=?)+1, " 
            + "  ?, ?, NOW(), 0, 0) ";
    param2 = [id, seq, seq, seq, title, content];
    conn.query(sql2, param2, function(err, results2){
            if(err) console.log(err);
    
            console.log(JSON.stringify(results2));
    
            if(results2.affectedRows == 1){
                res.render('message.ejs', {proc:"answer2", msg:"OK"});
            }else{
                res.render('message.ejs', {proc:"answer2", msg:"NO"});
            }
    
    });
});

module.exports = app;