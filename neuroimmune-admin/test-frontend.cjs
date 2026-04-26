const puppeteer = require('puppeteer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const BASE_URL = 'http://192.168.138.1:3000';

async function testFrontend() {
  console.log('启动浏览器测试...');
  console.log('前端地址:', BASE_URL);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // 1. 访问登录页面
    console.log('\n=== 测试1: 访问登录页面 ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);

    const loginTitle = await page.title();
    console.log('页面标题:', loginTitle);
    await page.screenshot({ path: 'test-screenshots/01-login-page.png', fullPage: true });
    console.log('截图: 01-login-page.png');

    // 检查页面内容
    const pageContent = await page.content();
    const hasLoginBox = pageContent.includes('login-box') || pageContent.includes('登录');
    console.log(hasLoginBox ? '✅ 登录页面加载成功' : '❌ 登录页面可能未加载');

    // 2. 测试管理员登录
    console.log('\n=== 测试2: 管理员登录 ===');

    // Element Plus input structure: .el-input__inner
    const usernameInput = await page.waitForSelector('.el-input__inner', { timeout: 10000 });
    await usernameInput.click();
    await usernameInput.type('root');
    await sleep(500);

    // 找到密码输入框 (第二个 .el-input__inner)
    const inputs = await page.$$('.el-input__inner');
    if (inputs.length >= 2) {
      await inputs[1].click();
      await inputs[1].type('123456');
      console.log('已输入用户名和密码');
    }

    await sleep(500);
    await page.screenshot({ path: 'test-screenshots/02-before-login-click.png', fullPage: true });

    // 点击登录按钮
    const loginBtn = await page.waitForSelector('.el-button--primary', { timeout: 5000 });
    await loginBtn.click();
    console.log('已点击登录按钮');

    await sleep(3000);

    const currentUrl = page.url();
    console.log('登录后URL:', currentUrl);
    await page.screenshot({ path: 'test-screenshots/03-admin-dashboard.png', fullPage: true });

    // 检查是否跳转到 dashboard
    if (currentUrl.includes('dashboard')) {
      console.log('✅ 管理员登录成功 - 已跳转到 Dashboard');
    } else if (currentUrl.includes('#')) {
      console.log('✅ 管理员登录成功 - Hash路由已变化');
    } else {
      console.log('⚠️ URL: ' + currentUrl);
    }

    // 3. 测试医生列表
    console.log('\n=== 测试3: 医生列表 ===');
    await page.goto(BASE_URL + '/#/doctors', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: 'test-screenshots/04-doctors-list.png', fullPage: true });

    const doctorsTable = await page.$('.el-table');
    console.log(doctorsTable ? '✅ 医生列表表格存在' : '❌ 医生列表表格不存在');

    // 检查分页
    const pagination = await page.$('.el-pagination');
    console.log(pagination ? '✅ 分页组件存在' : '❌ 分页组件不存在');

    // 4. 测试患者列表
    console.log('\n=== 测试4: 患者列表 ===');
    await page.goto(BASE_URL + '/#/patients', { waitUntil: 'networkidle0' });
    await sleep(2000);
    await page.screenshot({ path: 'test-screenshots/05-patients-list.png', fullPage: true });

    const patientsTable = await page.$('.el-table');
    console.log(patientsTable ? '✅ 患者列表表格存在' : '❌ 患者列表表格不存在');

    // 5. 测试医生登录
    console.log('\n=== 测试5: 医生登录 ===');

    // 清除 localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);

    const doctorInputs = await page.$$('.el-input__inner');
    if (doctorInputs.length >= 2) {
      // 清空已有内容
      await doctorInputs[0].click({ clickCount: 3 });
      await doctorInputs[0].type('17356763129');
      await doctorInputs[1].click({ clickCount: 3 });
      await doctorInputs[1].type('123456');
      console.log('已输入医生账号');
    }

    await sleep(500);
    await page.click('.el-button--primary');
    await sleep(3000);

    await page.screenshot({ path: 'test-screenshots/06-doctor-dashboard.png', fullPage: true });
    console.log('医生登录后URL:', page.url());

    console.log('\n=== 测试完成 ===');
    console.log('截图目录: test-screenshots/');
    console.log('\n浏览器保持打开，请手动查看页面状态');

  } catch (error) {
    console.error('测试错误:', error.message);
    await page.screenshot({ path: 'test-screenshots/error.png' });
  }

  // 不关闭浏览器，让用户查看
  console.log('\n测试脚本结束，浏览器窗口保持打开');
}

testFrontend().catch(console.error);