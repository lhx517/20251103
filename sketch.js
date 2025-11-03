let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let score = 0;
let testCompleted = false;
let table;
let answers = [];
let feedback = "";
let lastAnswer = null; // 儲存最後一次作答的結果
let showCorrectAnswer = false; // 是否顯示正確答案
let correctAnswerTimer = 0; // 計時器，用於控制正確答案的顯示時間

// 背景動畫的粒子陣列
let particles = [];
class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(20, 60);
    this.baseSize = this.size;
    this.xSpeed = random(-2, 2);
    this.ySpeed = random(-2, 2);
    this.angle = random(TWO_PI);
    this.hue = random(360);
    this.saturation = random(50, 80);
    this.brightness = random(70, 90);
  }
  
  update() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    this.angle += 0.02;
    
    // 使用正弦函數讓大小產生呼吸效果
    this.size = this.baseSize + sin(this.angle) * 10;
    
    if (this.x < -this.size) this.x = width + this.size;
    if (this.x > width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = height + this.size;
    if (this.y > height + this.size) this.y = -this.size;
  }
  
  draw() {
    colorMode(HSB);
    noStroke();
    // 使用HSB顏色模式來創建更豐富的顏色
    fill(this.hue, this.saturation, this.brightness, 0.6);
    circle(this.x, this.y, this.size);
    
    // 添加內圈產生光暈效果
    fill(this.hue, this.saturation, this.brightness, 0.3);
    circle(this.x, this.y, this.size * 1.5);
    colorMode(RGB);
  }
}

function preload() {
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  
  // 從CSV載入所有題目
  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    questions.push({
      question: row.getString('題目'),
      options: [
        row.getString('選項A'),
        row.getString('選項B'),
        row.getString('選項C'),
        row.getString('選項D')
      ],
      correct: row.getString('正確答案')
    });
  }
  
  // 隨機選擇4題
  let indices = [];
  for(let i = 0; i < questions.length; i++) indices.push(i);
  for(let i = 0; i < 4; i++) {
    let randomIndex = floor(random(indices.length));
    selectedQuestions.push(questions[indices[randomIndex]]);
    indices.splice(randomIndex, 1);
  }
  
  // 創建背景粒子
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle());
  }
}

// 當視窗大小改變時調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新調整粒子位置
  for (let particle of particles) {
    particle.x = random(width);
    particle.y = random(height);
  }
}

function draw() {
  background(20, 30, 40); // 深色背景讓粒子更明顯
  
  // 更新和繪製背景粒子
  for (let particle of particles) {
    particle.update();
    particle.draw();
  }
  
  // 計算內容區域的尺寸
  let contentWidth = min(800, width - 40);
  let contentHeight = min(600, height - 40);
  let contentTop = height/2 - contentHeight/2;
  
  // 在內容區域加入半透明背景，確保文字容易閱讀
  noStroke();
  fill(230, 230, 230, 200);
  rectMode(CENTER);
  rect(width/2, height/2, contentWidth, contentHeight, 15);
  
  if (!testCompleted) {
    // 顯示當前題目
    let q = selectedQuestions[currentQuestion];
    
    // 題目
    textSize(min(24, contentWidth/30));
    fill(0);
    text(`題目 ${currentQuestion + 1}/4:\n${q.question}`, width/2, contentTop + contentHeight * 0.2);
    
    // 選項
    textSize(min(20, contentWidth/35));
    let optionWidth = contentWidth * 0.4; // 選項寬度
    let optionHeight = 60; // 選項高度
    let optionSpacingX = contentWidth * 0.45; // 選項水平間距
    let optionSpacingY = contentHeight * 0.2; // 選項垂直間距
    let firstOptionY = contentTop + contentHeight * 0.4; // 第一列選項的Y位置
    
    for(let i = 0; i < 4; i++) {
      let row = floor(i / 2); // 計算行數（0或1）
      let col = i % 2; // 計算列數（0或1）
      
      let x = width/2 + (col * 2 - 1) * optionSpacingX/2; // 計算x位置
      let y = firstOptionY + row * optionSpacingY; // 計算y位置
      let optionLetter = String.fromCharCode(65 + i);
      
      // 檢查滑鼠是否在按鈕上
      if (mouseY > y - optionHeight/2 && mouseY < y + optionHeight/2 && 
          mouseX > x - optionWidth/2 && mouseX < x + optionWidth/2) {
        fill(200);
      } else {
        fill(255);
      }
      
      // 繪製選項按鈕
      rectMode(CENTER);
      rect(x, y, optionWidth, optionHeight, 10);
      fill(0);
      text(optionLetter + ". " + q.options[i], x, y);
    }
    
    // 如果需要顯示正確答案的提示
    if (showCorrectAnswer) {
      let correctAns = q.correct;
      fill(220, 53, 69); // 使用紅色
      textSize(min(16, contentWidth/40));
      text(`正確答案是: ${correctAns}`, width/2, firstOptionY + optionSpacingY + 50);
      
      // 更新計時器
      correctAnswerTimer++;
      if (correctAnswerTimer > 120) { // 約2秒後
        showCorrectAnswer = false;
        correctAnswerTimer = 0;
        
        // 自動進入下一題
        currentQuestion++;
        if(currentQuestion >= 4) {
          testCompleted = true;
        }
      }
    }
  } else {
    // 顯示結果
    textSize(min(32, contentWidth/20));
    fill(0);
    text(`測驗完成!\n得分: ${score}/4`, width/2, contentTop + contentHeight * 0.25);
    
    textSize(min(24, contentWidth/25));
    let feedbackText = "";
    if(score === 4) {
      feedbackText = "太棒了！完美表現！";
    } else if(score >= 2) {
      feedbackText = "做得不錯，繼續加油！";
    } else {
      feedbackText = "還需要多加練習喔！";
    }
    text(feedbackText, width/2, contentTop + contentHeight * 0.5);
    
    // 顯示重新開始按鈕
    let buttonY = contentTop + contentHeight * 0.7;
    if (mouseY > buttonY - 25 && mouseY < buttonY + 25 && 
        mouseX > width/2 - contentWidth/8 && mouseX < width/2 + contentWidth/8) {
      fill(200);
    } else {
      fill(255);
    }
    rect(width/2, buttonY, contentWidth/4, 50, 10);
    fill(0);
    text("重新開始", width/2, buttonY);
  }
}

function mousePressed() {
  // 計算內容區域的尺寸和位置
  let contentWidth = min(800, width - 40);
  let contentHeight = min(600, height - 40);
  let contentTop = height/2 - contentHeight/2;
  let optionSpacing = contentHeight * 0.15;
  let firstOptionY = contentTop + contentHeight * 0.4;
  
  if (!testCompleted) {
    // 檢查是否點擊了選項
    let optionWidth = contentWidth * 0.4;
    let optionHeight = 60;
    let optionSpacingX = contentWidth * 0.45;
    let optionSpacingY = contentHeight * 0.2;
    let firstOptionY = contentTop + contentHeight * 0.4;

    for(let i = 0; i < 4; i++) {
      let row = floor(i / 2);
      let col = i % 2;
      let x = width/2 + (col * 2 - 1) * optionSpacingX/2;
      let y = firstOptionY + row * optionSpacingY;
      
      if (mouseY > y - optionHeight/2 && mouseY < y + optionHeight/2 && 
          mouseX > x - optionWidth/2 && mouseX < x + optionWidth/2) {
        // 記錄答案
        let optionLetter = String.fromCharCode(65 + i);
        if(optionLetter === selectedQuestions[currentQuestion].correct) {
          score++;
          // 正確答案，直接進入下一題
          currentQuestion++;
          if(currentQuestion >= 4) {
            testCompleted = true;
          }
        } else {
          // 答錯時，顯示正確答案
          showCorrectAnswer = true;
          correctAnswerTimer = 0;
        }
      }
    }
  } else {
    // 檢查是否點擊重新開始按鈕
    let buttonY = contentTop + contentHeight * 0.7;
    if (mouseY > buttonY - 25 && mouseY < buttonY + 25 && 
        mouseX > width/2 - contentWidth/8 && mouseX < width/2 + contentWidth/8) {
      // 重置測驗
      currentQuestion = 0;
      score = 0;
      testCompleted = false;
      selectedQuestions = [];
      
      // 重新隨機選擇題目
      let indices = [];
      for(let i = 0; i < questions.length; i++) indices.push(i);
      for(let i = 0; i < 4; i++) {
        let randomIndex = floor(random(indices.length));
        selectedQuestions.push(questions[indices[randomIndex]]);
        indices.splice(randomIndex, 1);
      }
    }
  }
}
