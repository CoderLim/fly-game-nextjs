import * as THREE from 'three';

/**
 * 创建热气球模型
 * 按照指定要求构建一个包含气球本体、吊篮系统和连接结构的热气球
 * @returns {THREE.Group} 热气球的完整组合对象
 */
export function createHotAirBalloon() {
  // 创建主组，所有组件的原点位于气球球心
  const group = new THREE.Group();

  // 创建子组件
  const balloon = createBalloon();
  const rimConnectors = createRimConnectors();
  const mainCables = createMainCables();
  const basketAssembly = createBasketAssembly();

  // 将吊篮定位到(0,-7,0)
  basketAssembly.position.set(0, -7, 0);

  // 添加子组件到主组
  group.add(balloon);
  group.add(rimConnectors);
  group.add(mainCables);
  group.add(basketAssembly);

  // 添加动画相关属性
  group.userData = {
    originalScale: 1,
    time: 0,
    basketOriginalRotation: 0
  };

  return group;
}

/**
 * 创建气球本体
 * 包括球体和顶部锥形结构
 */
function createBalloon() {
  const balloonGroup = new THREE.Group();

  // 创建气球球体 - 半径5的球体
  const sphereGeometry = new THREE.SphereGeometry(5, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.75);
  
  // 创建材质 - 改用基础材质以实现更鲜艳的颜色
  const balloonMaterial = new THREE.MeshPhongMaterial({
    side: THREE.DoubleSide, // 双面渲染
    vertexColors: true,
    shininess: 100,
    specular: 0x444444
  });

  // 添加顶点颜色来实现更加明显的渐变和条纹
  const colors = [];
  const positions = sphereGeometry.getAttribute('position');
  const count = positions.count;

  // 更鲜艳的颜色组合
  const colorPairs = [
    // 红色到黄色
    {
      start: new THREE.Color(0xff2200), // 亮红色
      end: new THREE.Color(0xffff00)    // 亮黄色
    },
    // 蓝色到青色
    {
      start: new THREE.Color(0x0088ff), // 亮蓝色
      end: new THREE.Color(0x00ffaa)    // 青绿色
    },
    // 紫色到粉色
    {
      start: new THREE.Color(0x8800ff), // 紫色
      end: new THREE.Color(0xff00aa)    // 粉红色
    }
  ];
  
  // 随机选择一种颜色组合
  const selectedColorPair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
  
  // 条纹的数量
  const stripeCount = 12;
  // 条纹的厚度 (0-1之间，越小条纹越窄)
  const stripeThickness = 0.3;
  
  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    // 归一化y值到0-1，用于垂直渐变
    const normalizedY = (y + 5) / 10;
    
    // 计算与Y轴的角度，用于创建水平条纹
    const angle = Math.atan2(Math.sqrt(x*x + z*z), y);
    const normalizedAngle = angle / Math.PI;
    
    // 条纹效果 - 使用sin函数创建周期性变化
    const stripeValue = Math.sin(normalizedAngle * stripeCount * Math.PI);
    // 转换为0或1（根据stripeThickness确定条纹宽度）
    const isStripe = Math.abs(stripeValue) > stripeThickness ? 1 : 0;
    
    // 混合垂直渐变和条纹效果
    const baseColor = new THREE.Color().lerpColors(
      selectedColorPair.start,
      selectedColorPair.end,
      normalizedY
    );
    
    // 为条纹区域增加亮度
    if (isStripe) {
      baseColor.offsetHSL(0, 0, 0.2); // 增加亮度
    }
    
    colors.push(baseColor.r, baseColor.g, baseColor.b);
  }

  // 将颜色添加到几何体
  sphereGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  const balloon = new THREE.Mesh(sphereGeometry, balloonMaterial);
  balloonGroup.add(balloon);

  // 创建顶部锥形结构 - 倒置的圆锥体(半径0.8,高度2)
  const coneGeometry = new THREE.ConeGeometry(0.8, 2, 16);
  const coneMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x444444,
    shininess: 60
  });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);
  cone.rotation.x = Math.PI; // 倒置
  cone.position.y = 5; // 放置在球体顶部
  balloonGroup.add(cone);

  return balloonGroup;
}

/**
 * 创建开口边缘的连接器
 * 环形排列12个细圆柱体
 */
function createRimConnectors() {
  const rimGroup = new THREE.Group();
  
  // 12根细圆柱(半径0.1,高度0.5)
  const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  
  // 球体开口的半径约为5 * sin(π/4) ≈ 3.5
  const radius = 3.5;
  const bottomY = -3.75; // 1/4球体的底部y值 (-5 + 5*0.25)
  
  // 环形排列12个圆柱
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.set(x, bottomY, z);
    cylinder.rotation.x = Math.PI / 2; // 让圆柱垂直于切面
    
    // 调整圆柱朝向球心
    cylinder.lookAt(0, 0, 0);
    cylinder.rotation.x += Math.PI / 2;
    
    rimGroup.add(cylinder);
    
    // 存储连接点信息用于缆绳
    cylinder.userData = {
      connectorIndex: i,
      position: new THREE.Vector3(x, bottomY, z)
    };
  }
  
  return rimGroup;
}

/**
 * 创建吊篮系统
 * 包括主体立方体和防护栏
 */
function createBasketAssembly() {
  const basketGroup = new THREE.Group();
  
  // 主体：立方体(2x2x2)
  const basketGeometry = new THREE.BoxGeometry(2, 2, 2);
  const basketMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513, // 棕色，像木头
    roughness: 0.8,
    metalness: 0.2
  });
  const basket = new THREE.Mesh(basketGeometry, basketMaterial);
  basketGroup.add(basket);
  
  // 防护栏：四边各布置3根垂直圆柱
  const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  // 顶部环绕水平圆柱环
  const topRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
  const sideRailGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 8);
  
  // 四边各布置3根垂直圆柱
  const edges = [
    [-1, -1], [0, -1], [1, -1], // 前边
    [1, -1], [1, 0], [1, 1],    // 右边
    [1, 1], [0, 1], [-1, 1],    // 后边
    [-1, 1], [-1, 0], [-1, -1]  // 左边
  ];
  
  for (let i = 0; i < edges.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const x = edges[i + j][0];
      const z = edges[i + j][1];
      
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(x, 0.5, z);
      basketGroup.add(rail);
    }
  }
  
  // 顶部环绕的4根水平圆柱环
  const topRailPositions = [
    { pos: [0, 2, -1], rot: [Math.PI/2, 0, 0] },  // 前
    { pos: [1, 2, 0], rot: [Math.PI/2, 0, Math.PI/2] }, // 右
    { pos: [0, 2, 1], rot: [Math.PI/2, 0, 0] },   // 后
    { pos: [-1, 2, 0], rot: [Math.PI/2, 0, Math.PI/2] } // 左
  ];
  
  topRailPositions.forEach(rail => {
    const topRail = new THREE.Mesh(topRailGeometry, railMaterial);
    topRail.position.set(...rail.pos);
    topRail.rotation.set(...rail.rot);
    basketGroup.add(topRail);
  });
  
  return basketGroup;
}

/**
 * 创建连接结构（主缆绳）
 * 8根曲线路径圆柱体，连接气球开口到吊篮顶部四角
 */
function createMainCables() {
  const cablesGroup = new THREE.Group();
  
  // 缆绳使用的材质
  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  
  // 气球开口y坐标
  const balloonBottomY = -3.75;
  
  // 吊篮顶部四角坐标 (相对于篮子中心)
  const basketCorners = [
    { x: -1, y: 1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: 1, y: 1, z: 1 },
    { x: -1, y: 1, z: 1 }
  ];
  
  // 篮子的位置是(0,-7,0)，所以需要加上这个偏移
  const basketY = -7;
  
  // 计算吊篮顶部四角的全局坐标
  const basketTopCorners = basketCorners.map(corner => ({
    x: corner.x,
    y: corner.y + basketY,
    z: corner.z
  }));
  
  // 创建8根缆绳，每个角各2根
  for (let i = 0; i < 4; i++) {
    // 每个角各取2个开口点
    const connIndex1 = i * 3;
    const connIndex2 = i * 3 + 1;
    
    // 气球开口的两个连接点
    const balloonRadius = 3.5;
    const angle1 = (connIndex1 / 12) * Math.PI * 2;
    const angle2 = (connIndex2 / 12) * Math.PI * 2;
    
    const startPoint1 = {
      x: Math.cos(angle1) * balloonRadius,
      y: balloonBottomY,
      z: Math.sin(angle1) * balloonRadius
    };
    
    const startPoint2 = {
      x: Math.cos(angle2) * balloonRadius,
      y: balloonBottomY,
      z: Math.sin(angle2) * balloonRadius
    };
    
    // 吊篮顶部的一个角的坐标
    const endPoint = basketTopCorners[i];
    
    // 为第一根缆绳创建曲线
    createCableBetweenPoints(startPoint1, endPoint, cablesGroup, cableMaterial);
    
    // 为第二根缆绳创建曲线
    createCableBetweenPoints(startPoint2, endPoint, cablesGroup, cableMaterial);
  }
  
  // 创建4根对角加强索（连接相对角）
  for (let i = 0; i < 4; i++) {
    // 对角索连接点
    const startCorner = basketTopCorners[i];
    const endCorner = basketTopCorners[(i + 2) % 4]; // 对角
    
    // 加强索是直线，不是曲线
    createStraightCable(startCorner, endCorner, cablesGroup, cableMaterial);
  }
  
  return cablesGroup;
}

/**
 * 在两点之间创建曲线缆绳
 */
function createCableBetweenPoints(start, end, parent, material) {
  // 创建控制点，使缆绳呈现弧形
  const midY = (start.y + end.y) / 2;
  const controlPoint = {
    x: (start.x + end.x) / 2,
    y: midY - 1, // 向下弯曲
    z: (start.z + end.z) / 2
  };
  
  // 创建曲线路径
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(controlPoint.x, controlPoint.y, controlPoint.z),
    new THREE.Vector3(end.x, end.y, end.z)
  );
  
  // 使用曲线创建管状几何体
  const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.04, 8, false);
  const cable = new THREE.Mesh(tubeGeometry, material);
  
  parent.add(cable);
  return cable;
}

/**
 * 创建直线缆绳（用于加强索）
 */
function createStraightCable(start, end, parent, material) {
  // 创建直线路径
  const path = new THREE.LineCurve3(
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(end.x, end.y, end.z)
  );
  
  // 使用路径创建管状几何体
  const tubeGeometry = new THREE.TubeGeometry(path, 1, 0.04, 8, false);
  const cable = new THREE.Mesh(tubeGeometry, material);
  
  parent.add(cable);
  return cable;
}

/**
 * 更新热气球的动画效果
 * @param {THREE.Group} balloon 热气球组对象
 * @param {number} deltaTime 时间增量
 */
export function updateHotAirBalloon(balloon, deltaTime) {
  if (!balloon || !balloon.userData) return;
  
  // 累加时间
  balloon.userData.time += deltaTime;
  
  // 气球膨胀效果：1 → 1.05周期性变化
  const pulseFactor = 1 + 0.05 * Math.sin(balloon.userData.time * 0.5);
  balloon.children[0].scale.set(pulseFactor, pulseFactor, pulseFactor);
  
  // 吊篮摆动：绕Y轴±2度振荡
  const basketSwing = Math.sin(balloon.userData.time * 0.8) * Math.PI / 90; // ±2度
  balloon.children[3].rotation.y = basketSwing;
} 