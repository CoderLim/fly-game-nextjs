import * as THREE from 'three';

// 存储所有自然元素的集合
const natureElements = new THREE.Group();
const loadedNatureChunks = new Map();
const NATURE_CHUNK_SIZE = 500; // 自然元素区块大小与建筑区块相同

// 不同的树木模型
function createTree(type = 'normal') {
  const treeGroup = new THREE.Group();
  
  // 基于类型创建不同形状的树
  switch(type) {
    case 'pine': // 松树
      // 树干
      const pineTrunkGeometry = new THREE.CylinderGeometry(1, 1.5, 15, 8);
      const pineTrunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        flatShading: true
      });
      const pineTrunk = new THREE.Mesh(pineTrunkGeometry, pineTrunkMaterial);
      pineTrunk.castShadow = true;
      pineTrunk.position.y = 7.5;
      treeGroup.add(pineTrunk);
      
      // 树冠 - 多层圆锥形
      const pineColors = [0x006400, 0x228B22, 0x308014];
      const pineColor = pineColors[Math.floor(Math.random() * pineColors.length)];
      const pineMaterial = new THREE.MeshPhongMaterial({
        color: pineColor,
        flatShading: true
      });
      
      // 叠加的4层树冠
      for (let i = 0; i < 4; i++) {
        const height = 6 - i * 0.5;
        const radius = 5 - i * 0.7;
        const posY = 10 + i * 3;
        
        const pineTopGeometry = new THREE.ConeGeometry(radius, height, 8);
        const pineTop = new THREE.Mesh(pineTopGeometry, pineMaterial);
        pineTop.position.y = posY;
        pineTop.castShadow = true;
        treeGroup.add(pineTop);
      }
      break;
      
    case 'palm': // 棕榈树
      // 弯曲的树干
      const segments = 10;
      const palmTrunkGeometry = new THREE.CylinderGeometry(0.6, 1, 15, 8);
      const palmTrunkMaterial = new THREE.MeshPhongMaterial({
        color: 0xA0522D,
        flatShading: true
      });
      
      // 弯曲树干
      const palmTrunk = new THREE.Mesh(palmTrunkGeometry, palmTrunkMaterial);
      palmTrunk.castShadow = true;
      // 随机倾斜方向
      const bendAngle = Math.random() * 0.2 + 0.05;
      const bendDirection = Math.random() * Math.PI * 2;
      palmTrunk.position.y = 7.5;
      palmTrunk.rotation.x = Math.sin(bendDirection) * bendAngle;
      palmTrunk.rotation.z = Math.cos(bendDirection) * bendAngle;
      treeGroup.add(palmTrunk);
      
      // 棕榈叶
      const leafCount = 5 + Math.floor(Math.random() * 4);
      const leafMaterial = new THREE.MeshPhongMaterial({
        color: 0x4CA64C,
        flatShading: true,
        side: THREE.DoubleSide
      });
      
      for (let i = 0; i < leafCount; i++) {
        // 创建棕榈叶的形状（简化为扁平的锥形）
        const leafGeometry = new THREE.ConeGeometry(0.5, 8, 4, 1, true);
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // 平面化叶子
        leaf.scale.y = 0.2;
        leaf.scale.x = 2;
        
        // 围绕树干顶部放置叶子
        const angle = (i / leafCount) * Math.PI * 2;
        leaf.position.set(
          Math.sin(angle) * 1.5,
          15,
          Math.cos(angle) * 1.5
        );
        
        // 使叶子向外倾斜
        leaf.rotation.x = Math.PI / 2;
        leaf.rotation.z = angle + Math.PI / 2;
        leaf.rotation.y = Math.PI / 8;
        
        leaf.castShadow = true;
        treeGroup.add(leaf);
      }
      break;
      
    default: // 普通树
      // 树干
      const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 10, 8);
      const trunkMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        flatShading: true
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.castShadow = true;
      trunk.position.y = 5;
      treeGroup.add(trunk);
      
      // 树冠
      const topGeometry = new THREE.SphereGeometry(5, 8, 8);
      const topMaterial = new THREE.MeshPhongMaterial({
        color: 0x228B22,
        flatShading: true
      });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 12;
      top.castShadow = true;
      treeGroup.add(top);
  }
  
  return treeGroup;
}

// 创建草丛
function createGrass() {
  const grassGroup = new THREE.Group();
  
  // 随机草丛大小
  const size = 1 + Math.random() * 2;
  
  // 随机草丛颜色
  const grassColors = [0x7CFC00, 0x90EE90, 0x32CD32, 0x6B8E23];
  const grassColor = grassColors[Math.floor(Math.random() * grassColors.length)];
  
  // 创建多个"草叶"组成草丛
  const bladesCount = 5 + Math.floor(Math.random() * 10);
  
  for (let i = 0; i < bladesCount; i++) {
    // 每片草叶不同的大小和角度
    const height = size * (0.5 + Math.random() * 0.5);
    const width = 0.1 + Math.random() * 0.2;
    
    const bladeGeometry = new THREE.BoxGeometry(width, height, width);
    const bladeMaterial = new THREE.MeshPhongMaterial({
      color: grassColor,
      flatShading: true
    });
    
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    
    // 放置草叶在基部周围
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * size * 0.5;
    blade.position.set(
      Math.sin(angle) * radius,
      height / 2,
      Math.cos(angle) * radius
    );
    
    // 随机倾斜草叶
    blade.rotation.x = (Math.random() - 0.5) * 0.2;
    blade.rotation.z = (Math.random() - 0.5) * 0.2;
    
    grassGroup.add(blade);
  }
  
  return grassGroup;
}

// 创建岩石
function createRock() {
  const rockGroup = new THREE.Group();
  
  // 随机岩石大小
  const size = 0.5 + Math.random() * 2;
  
  // 岩石颜色
  const rockColors = [0x808080, 0x696969, 0xA9A9A9, 0x778899];
  const rockColor = rockColors[Math.floor(Math.random() * rockColors.length)];
  
  // 使用几个变形球体创建自然形状的岩石
  const partsCount = 2 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < partsCount; i++) {
    const partSize = size * (0.6 + Math.random() * 0.4);
    
    // 使用八面体作为基础形状，更接近自然岩石
    const rockGeometry = new THREE.OctahedronGeometry(partSize, 1);
    const rockMaterial = new THREE.MeshPhongMaterial({
      color: rockColor,
      flatShading: true
    });
    
    // 随机变形顶点位置，使岩石更自然
    const vertices = rockGeometry.attributes.position;
    for (let j = 0; j < vertices.count; j++) {
      const x = vertices.getX(j);
      const y = vertices.getY(j);
      const z = vertices.getZ(j);
      
      vertices.setX(j, x + (Math.random() - 0.5) * 0.4 * partSize);
      vertices.setY(j, y + (Math.random() - 0.5) * 0.4 * partSize);
      vertices.setZ(j, z + (Math.random() - 0.5) * 0.4 * partSize);
    }
    
    vertices.needsUpdate = true;
    
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // 放置岩石部分
    rock.position.set(
      (Math.random() - 0.5) * partSize * 0.5,
      partSize * 0.5 * (i === 0 ? 0 : 0.6),
      (Math.random() - 0.5) * partSize * 0.5
    );
    
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);
  }
  
  return rockGroup;
}

// 创建小动物
function createAnimal(type = 'random') {
  const animalGroup = new THREE.Group();
  
  // 如果传入的类型是random，则随机选择一种动物
  if (type === 'random') {
    const types = ['rabbit', 'bird', 'squirrel'];
    type = types[Math.floor(Math.random() * types.length)];
  }
  
  // 基于类型创建不同动物
  switch(type) {
    case 'rabbit':
      // 兔子身体
      const bodyGeometry = new THREE.SphereGeometry(1, 8, 8);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xDDDDDD,
        flatShading: true
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1;
      body.scale.z = 1.2;
      animalGroup.add(body);
      
      // 兔子头
      const headGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      const head = new THREE.Mesh(headGeometry, bodyMaterial);
      head.position.set(0, 1.5, 0.8);
      animalGroup.add(head);
      
      // 耳朵
      const earGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
      const ear1 = new THREE.Mesh(earGeometry, bodyMaterial);
      ear1.position.set(0.25, 2.1, 0.8);
      ear1.rotation.z = 0.2;
      animalGroup.add(ear1);
      
      const ear2 = new THREE.Mesh(earGeometry, bodyMaterial);
      ear2.position.set(-0.25, 2.1, 0.8);
      ear2.rotation.z = -0.2;
      animalGroup.add(ear2);
      
      // 腿
      const legGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
      const legMaterial = new THREE.MeshPhongMaterial({
        color: 0xCCCCCC,
        flatShading: true
      });
      
      const frontLeg1 = new THREE.Mesh(legGeometry, legMaterial);
      frontLeg1.position.set(0.5, 0.3, 0.6);
      animalGroup.add(frontLeg1);
      
      const frontLeg2 = new THREE.Mesh(legGeometry, legMaterial);
      frontLeg2.position.set(-0.5, 0.3, 0.6);
      animalGroup.add(frontLeg2);
      
      const backLeg1 = new THREE.Mesh(legGeometry, legMaterial);
      backLeg1.scale.y = 1.5;
      backLeg1.position.set(0.5, 0.45, -0.6);
      animalGroup.add(backLeg1);
      
      const backLeg2 = new THREE.Mesh(legGeometry, legMaterial);
      backLeg2.scale.y = 1.5;
      backLeg2.position.set(-0.5, 0.45, -0.6);
      animalGroup.add(backLeg2);
      
      // 眼睛
      const eyeGeometry = new THREE.SphereGeometry(0.1, 6, 6);
      const eyeMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: false
      });
      
      const eye1 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye1.position.set(0.2, 1.6, 1.3);
      animalGroup.add(eye1);
      
      const eye2 = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye2.position.set(-0.2, 1.6, 1.3);
      animalGroup.add(eye2);
      
      // 小尾巴
      const tailGeometry = new THREE.SphereGeometry(0.3, 6, 6);
      const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
      tail.position.set(0, 1, -1.2);
      animalGroup.add(tail);
      
      // 设置兔子的运动属性
      animalGroup.userData.type = 'rabbit';
      animalGroup.userData.speed = 0.05 + Math.random() * 0.1;
      animalGroup.userData.hopHeight = 0.3 + Math.random() * 0.2;
      animalGroup.userData.hopTime = 0;
      animalGroup.userData.direction = new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize();
      animalGroup.userData.changeDirCounter = 0;
      animalGroup.userData.maxChangeDirCounter = 100 + Math.floor(Math.random() * 200);
      
      break;
      
    case 'bird':
      // 鸟身体
      const birdBodyGeometry = new THREE.SphereGeometry(0.5, 8, 8);
      // 随机鸟的颜色
      const birdColors = [0x3399FF, 0xFF3333, 0x33CC33, 0xFFCC00];
      const birdColor = birdColors[Math.floor(Math.random() * birdColors.length)];
      const birdMaterial = new THREE.MeshPhongMaterial({
        color: birdColor,
        flatShading: true
      });
      const birdBody = new THREE.Mesh(birdBodyGeometry, birdMaterial);
      birdBody.scale.z = 1.3;
      animalGroup.add(birdBody);
      
      // 鸟头
      const birdHeadGeometry = new THREE.SphereGeometry(0.3, 8, 8);
      const birdHead = new THREE.Mesh(birdHeadGeometry, birdMaterial);
      birdHead.position.set(0, 0.2, 0.5);
      animalGroup.add(birdHead);
      
      // 鸟嘴
      const beakGeometry = new THREE.ConeGeometry(0.1, 0.4, 4);
      const beakMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        flatShading: true
      });
      const beak = new THREE.Mesh(beakGeometry, beakMaterial);
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0.2, 0.9);
      animalGroup.add(beak);
      
      // 翅膀
      const wingGeometry = new THREE.BoxGeometry(1, 0.1, 0.5);
      
      const wing1 = new THREE.Mesh(wingGeometry, birdMaterial);
      wing1.position.set(0.6, 0.1, 0);
      // 存储初始状态用于翅膀扇动动画
      wing1.userData.baseY = wing1.position.y;
      wing1.userData.flapSpeed = 0.2 + Math.random() * 0.1;
      wing1.userData.flapHeight = 0.2 + Math.random() * 0.1;
      animalGroup.add(wing1);
      
      const wing2 = new THREE.Mesh(wingGeometry, birdMaterial);
      wing2.position.set(-0.6, 0.1, 0);
      // 与另一翼对称扇动
      wing2.userData.baseY = wing2.position.y;
      wing2.userData.flapSpeed = wing1.userData.flapSpeed;
      wing2.userData.flapHeight = wing1.userData.flapHeight;
      animalGroup.add(wing2);
      
      // 尾巴
      const tailPlaneGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
      const tailPlane = new THREE.Mesh(tailPlaneGeometry, birdMaterial);
      tailPlane.position.set(0, 0, -0.7);
      animalGroup.add(tailPlane);
      
      // 眼睛
      const birdEyeGeometry = new THREE.SphereGeometry(0.05, 6, 6);
      const birdEyeMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: false
      });
      
      const birdEye1 = new THREE.Mesh(birdEyeGeometry, birdEyeMaterial);
      birdEye1.position.set(0.15, 0.3, 0.7);
      animalGroup.add(birdEye1);
      
      const birdEye2 = new THREE.Mesh(birdEyeGeometry, birdEyeMaterial);
      birdEye2.position.set(-0.15, 0.3, 0.7);
      animalGroup.add(birdEye2);
      
      // 设置鸟的飞行属性
      animalGroup.userData.type = 'bird';
      animalGroup.userData.flyHeight = 10 + Math.random() * 30;
      animalGroup.position.y = animalGroup.userData.flyHeight; // 鸟在空中
      animalGroup.userData.speed = 0.2 + Math.random() * 0.3;
      animalGroup.userData.direction = new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize();
      animalGroup.userData.changeDirCounter = 0;
      animalGroup.userData.maxChangeDirCounter = 100 + Math.floor(Math.random() * 200);
      animalGroup.userData.wings = [wing1, wing2]; // 保存翅膀引用用于动画
      
      break;
      
    case 'squirrel':
      // 松鼠身体
      const squirrelBodyGeometry = new THREE.SphereGeometry(0.6, 8, 8);
      const squirrelMaterial = new THREE.MeshPhongMaterial({
        color: 0xA0522D,
        flatShading: true
      });
      const squirrelBody = new THREE.Mesh(squirrelBodyGeometry, squirrelMaterial);
      squirrelBody.scale.z = 1.2;
      squirrelBody.position.y = 0.6;
      animalGroup.add(squirrelBody);
      
      // 松鼠头
      const squirrelHeadGeometry = new THREE.SphereGeometry(0.4, 8, 8);
      const squirrelHead = new THREE.Mesh(squirrelHeadGeometry, squirrelMaterial);
      squirrelHead.position.set(0, 1.1, 0.6);
      animalGroup.add(squirrelHead);
      
      // 耳朵
      const squirrelEarGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.1);
      const squirrelEar1 = new THREE.Mesh(squirrelEarGeometry, squirrelMaterial);
      squirrelEar1.position.set(0.2, 1.4, 0.6);
      animalGroup.add(squirrelEar1);
      
      const squirrelEar2 = new THREE.Mesh(squirrelEarGeometry, squirrelMaterial);
      squirrelEar2.position.set(-0.2, 1.4, 0.6);
      animalGroup.add(squirrelEar2);
      
      // 眼睛
      const squirrelEyeGeometry = new THREE.SphereGeometry(0.06, 6, 6);
      const squirrelEyeMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000,
        flatShading: false
      });
      
      const squirrelEye1 = new THREE.Mesh(squirrelEyeGeometry, squirrelEyeMaterial);
      squirrelEye1.position.set(0.15, 1.2, 0.9);
      animalGroup.add(squirrelEye1);
      
      const squirrelEye2 = new THREE.Mesh(squirrelEyeGeometry, squirrelEyeMaterial);
      squirrelEye2.position.set(-0.15, 1.2, 0.9);
      animalGroup.add(squirrelEye2);
      
      // 松鼠腿
      const squirrelLegGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
      
      const squirrelFrontLeg1 = new THREE.Mesh(squirrelLegGeometry, squirrelMaterial);
      squirrelFrontLeg1.position.set(0.3, 0.2, 0.4);
      animalGroup.add(squirrelFrontLeg1);
      
      const squirrelFrontLeg2 = new THREE.Mesh(squirrelLegGeometry, squirrelMaterial);
      squirrelFrontLeg2.position.set(-0.3, 0.2, 0.4);
      animalGroup.add(squirrelFrontLeg2);
      
      const squirrelBackLeg1 = new THREE.Mesh(squirrelLegGeometry, squirrelMaterial);
      squirrelBackLeg1.scale.y = 1.2;
      squirrelBackLeg1.position.set(0.3, 0.25, -0.4);
      animalGroup.add(squirrelBackLeg1);
      
      const squirrelBackLeg2 = new THREE.Mesh(squirrelLegGeometry, squirrelMaterial);
      squirrelBackLeg2.scale.y = 1.2;
      squirrelBackLeg2.position.set(-0.3, 0.25, -0.4);
      animalGroup.add(squirrelBackLeg2);
      
      // 松鼠大尾巴
      const tailGroup = new THREE.Group();
      
      const tailBaseGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
      tailBaseGeometry.translate(0, 0, -0.4);
      const tailBase = new THREE.Mesh(tailBaseGeometry, squirrelMaterial);
      tailBase.position.set(0, 0.8, -0.7);
      tailBase.rotation.x = Math.PI / 4;
      tailGroup.add(tailBase);
      
      const tailEndGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.8);
      tailEndGeometry.translate(0, 0, -0.4);
      const tailEnd = new THREE.Mesh(tailEndGeometry, squirrelMaterial);
      tailEnd.position.set(0, 0, -0.8);
      tailEnd.rotation.x = Math.PI / 4;
      tailGroup.add(tailEnd);
      
      animalGroup.add(tailGroup);
      
      // 设置松鼠的运动属性
      animalGroup.userData.type = 'squirrel';
      animalGroup.userData.speed = 0.08 + Math.random() * 0.15;
      animalGroup.userData.runHeight = 0.1;
      animalGroup.userData.runTime = 0;
      animalGroup.userData.direction = new THREE.Vector3(
        Math.random() - 0.5,
        0,
        Math.random() - 0.5
      ).normalize();
      animalGroup.userData.changeDirCounter = 0;
      animalGroup.userData.maxChangeDirCounter = 50 + Math.floor(Math.random() * 150);
      animalGroup.userData.tail = tailGroup; // 保存尾巴引用用于动画
      
      break;
  }
  
  return animalGroup;
}

// 生成区块中的自然元素
function generateNatureChunk(chunkX, chunkZ) {
  const chunkOriginX = chunkX * NATURE_CHUNK_SIZE;
  const chunkOriginZ = chunkZ * NATURE_CHUNK_SIZE;
  
  // 确定当前区块是什么类型
  const districtType = determineDistrictType(chunkX, chunkZ);
  
  // 使用确定性随机数生成器
  const chunkSeed = chunkX * 10000 + chunkZ;
  const random = () => {
    const x = Math.sin(chunkSeed + loadedNatureChunks.size) * 10000;
    return x - Math.floor(x);
  };
  
  // 根据区域类型确定自然元素的分布
  let treeCount, grassPatchCount, rockCount, animalCount;
  
  switch (districtType) {
    case 'commercial':
      // 商业区自然元素较少
      treeCount = Math.floor(random() * 3) + 2;
      grassPatchCount = Math.floor(random() * 10) + 5;
      rockCount = Math.floor(random() * 3);
      animalCount = Math.floor(random() * 2);
      break;
    case 'residential':
      // 住宅区有更多的树和草
      treeCount = Math.floor(random() * 5) + 5;
      grassPatchCount = Math.floor(random() * 15) + 10;
      rockCount = Math.floor(random() * 5) + 1;
      animalCount = Math.floor(random() * 3) + 1;
      break;
    case 'industrial':
      // 工业区自然元素最少
      treeCount = Math.floor(random() * 2) + 1;
      grassPatchCount = Math.floor(random() * 8) + 2;
      rockCount = Math.floor(random() * 8) + 1; // 更多岩石/碎片
      animalCount = Math.floor(random() * 1);
      break;
    default: // mixed
      // 混合区自然元素适中
      treeCount = Math.floor(random() * 4) + 3;
      grassPatchCount = Math.floor(random() * 12) + 8;
      rockCount = Math.floor(random() * 4) + 2;
      animalCount = Math.floor(random() * 2) + 1;
  }
  
  // 记录放置点以避免重叠
  const occupiedPositions = [];
  
  // 1. 放置树木
  for (let i = 0; i < treeCount; i++) {
    // 选择树的类型
    const treeTypes = ['normal', 'pine', 'palm'];
    const treeTypeDistribution = [0.5, 0.3, 0.2]; // 普通树更常见
    
    let treeType;
    const typeRoll = random();
    let accum = 0;
    
    for (let j = 0; j < treeTypeDistribution.length; j++) {
      accum += treeTypeDistribution[j];
      if (typeRoll < accum) {
        treeType = treeTypes[j];
        break;
      }
    }
    
    // 创建树
    const tree = createTree(treeType);
    
    // 随机位置，避开道路（道路宽度假设为15）
    const roadBuffer = 15;
    const roadSpacing = 100; // 街区大小
    
    let x, z;
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 10) {
      x = chunkOriginX + random() * NATURE_CHUNK_SIZE;
      z = chunkOriginZ + random() * NATURE_CHUNK_SIZE;
      
      // 检查是否在道路上
      const xMod = ((x % roadSpacing) + roadSpacing) % roadSpacing;
      const zMod = ((z % roadSpacing) + roadSpacing) % roadSpacing;
      const isOnRoad = (xMod < roadBuffer || xMod > roadSpacing - roadBuffer || 
                        zMod < roadBuffer || zMod > roadSpacing - roadBuffer);
      
      if (!isOnRoad) {
        // 检查是否与其他自然元素重叠
        let overlapping = false;
        for (const pos of occupiedPositions) {
          const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2));
          if (dist < pos.radius + 5) { // 5是树的半径
            overlapping = true;
            break;
          }
        }
        
        if (!overlapping) {
          validPosition = true;
          occupiedPositions.push({ x, z, radius: 5 });
        }
      }
      
      attempts++;
    }
    
    if (validPosition) {
      tree.position.set(x, 0, z);
      // 一些随机旋转以增加变化
      tree.rotation.y = random() * Math.PI * 2;
      natureElements.add(tree);
    }
  }
  
  // 2. 放置草丛
  for (let i = 0; i < grassPatchCount; i++) {
    const grass = createGrass();
    
    // 随机位置，草丛可以更自由地放置
    let x = chunkOriginX + random() * NATURE_CHUNK_SIZE;
    let z = chunkOriginZ + random() * NATURE_CHUNK_SIZE;
    
    // 草丛比较小，所以与其他元素的最小距离也可以小一点
    grass.position.set(x, 0, z);
    grass.rotation.y = random() * Math.PI * 2; // 随机旋转
    
    natureElements.add(grass);
  }
  
  // 3. 放置岩石
  for (let i = 0; i < rockCount; i++) {
    const rock = createRock();
    
    // 随机位置
    let x = chunkOriginX + random() * NATURE_CHUNK_SIZE;
    let z = chunkOriginZ + random() * NATURE_CHUNK_SIZE;
    
    rock.position.set(x, 0, z);
    rock.rotation.y = random() * Math.PI * 2; // 随机旋转
    
    natureElements.add(rock);
  }
  
  // 4. 放置动物
  for (let i = 0; i < animalCount; i++) {
    const animal = createAnimal('random');
    
    // 随机位置
    let x = chunkOriginX + random() * NATURE_CHUNK_SIZE;
    let z = chunkOriginZ + random() * NATURE_CHUNK_SIZE;
    
    // 如果是鸟，不需要避开道路
    if (animal.userData.type !== 'bird') {
      // 避开道路
      const roadBuffer = 15;
      const roadSpacing = 100;
      
      const xMod = ((x % roadSpacing) + roadSpacing) % roadSpacing;
      const zMod = ((z % roadSpacing) + roadSpacing) % roadSpacing;
      
      if (xMod < roadBuffer || xMod > roadSpacing - roadBuffer || 
          zMod < roadBuffer || zMod > roadSpacing - roadBuffer) {
        // 如果在路上，调整一下位置
        x = Math.floor(x / roadSpacing) * roadSpacing + roadBuffer + random() * (roadSpacing - 2 * roadBuffer);
        z = Math.floor(z / roadSpacing) * roadSpacing + roadBuffer + random() * (roadSpacing - 2 * roadBuffer);
      }
    }
    
    animal.position.set(x, 0, z);
    animal.rotation.y = random() * Math.PI * 2; // 随机朝向
    
    natureElements.add(animal);
  }
}

// 根据区块位置确定区域类型
function determineDistrictType(chunkX, chunkZ) {
  const sum = Math.abs(chunkX + chunkZ);
  
  if (sum % 4 === 0) return 'commercial';
  if (sum % 4 === 1) return 'residential';
  if (sum % 4 === 2) return 'industrial';
  return 'mixed';
}

// 初始化自然元素
export function createNatureElements() {
  // 初始加载中心区域的9个区块
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const chunkKey = `${x},${z}`;
      generateNatureChunk(x, z);
      loadedNatureChunks.set(chunkKey, true);
    }
  }
  
  return natureElements;
}

// 根据玩家位置更新自然元素区块
export function updateNatureChunks(playerPosition) {
  const currentChunkX = Math.floor(playerPosition.x / NATURE_CHUNK_SIZE);
  const currentChunkZ = Math.floor(playerPosition.z / NATURE_CHUNK_SIZE);
  
  // 检查周围的区块是否已加载
  for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
    for (let z = currentChunkZ - 1; z <= currentChunkZ + 1; z++) {
      const chunkKey = `${x},${z}`;
      if (!loadedNatureChunks.has(chunkKey)) {
        generateNatureChunk(x, z);
        loadedNatureChunks.set(chunkKey, true);
      }
    }
  }
  
  return natureElements;
}

// 更新动物动画（移动、动作等）
export function updateAnimals(deltaTime) {
  const time = Date.now() * 0.001; // 当前时间（秒）
  
  // 遍历自然元素中的所有动物
  natureElements.children.forEach(object => {
    // 只处理有userData.type的对象（动物）
    if (object.userData.type) {
      switch (object.userData.type) {
        case 'rabbit':
          // 兔子跳跃动画
          object.userData.hopTime += deltaTime;
          
          // 竖直跳跃动作
          if (object.userData.hopTime < 0.5) {
            // 上升阶段
            object.position.y = object.userData.hopHeight * Math.sin(object.userData.hopTime * Math.PI);
          } else {
            // 下降阶段
            object.position.y = 0;
            if (object.userData.hopTime > 1.0) {
              object.userData.hopTime = 0;
            }
          }
          
          // 水平移动与方向变化
          object.userData.changeDirCounter++;
          if (object.userData.changeDirCounter > object.userData.maxChangeDirCounter) {
            // 随机改变方向
            object.userData.direction = new THREE.Vector3(
              Math.random() - 0.5,
              0,
              Math.random() - 0.5
            ).normalize();
            
            // 重置计数器
            object.userData.changeDirCounter = 0;
            object.userData.maxChangeDirCounter = 100 + Math.floor(Math.random() * 200);
          }
          
          // 根据hopTime调整移动速度，跳跃时移动更快
          let moveSpeed = object.userData.speed;
          if (object.userData.hopTime > 0 && object.userData.hopTime < 0.5) {
            moveSpeed *= 2;
          }
          
          // 移动兔子
          object.position.x += object.userData.direction.x * moveSpeed;
          object.position.z += object.userData.direction.z * moveSpeed;
          
          // 让兔子朝向移动方向
          object.rotation.y = Math.atan2(object.userData.direction.x, object.userData.direction.z);
          break;
          
        case 'bird':
          // 鸟飞行动画 - 翅膀扇动
          for (const wing of object.userData.wings) {
            wing.rotation.z = Math.sin(time * wing.userData.flapSpeed * 10) * wing.userData.flapHeight;
          }
          
          // 移动和方向变化
          object.userData.changeDirCounter++;
          if (object.userData.changeDirCounter > object.userData.maxChangeDirCounter) {
            // 随机改变方向
            object.userData.direction = new THREE.Vector3(
              Math.random() - 0.5,
              0,
              Math.random() - 0.5
            ).normalize();
            
            // 小概率改变飞行高度
            if (Math.random() < 0.3) {
              object.userData.flyHeight = 10 + Math.random() * 30;
            }
            
            // 重置计数器
            object.userData.changeDirCounter = 0;
            object.userData.maxChangeDirCounter = 100 + Math.floor(Math.random() * 200);
          }
          
          // 慢慢调整到目标高度
          object.position.y += (object.userData.flyHeight - object.position.y) * 0.01;
          
          // 移动鸟
          object.position.x += object.userData.direction.x * object.userData.speed;
          object.position.z += object.userData.direction.z * object.userData.speed;
          
          // 让鸟朝向移动方向
          object.rotation.y = Math.atan2(object.userData.direction.x, object.userData.direction.z);
          break;
          
        case 'squirrel':
          // 松鼠跑动动画
          object.userData.runTime += deltaTime;
          
          // 小幅度上下移动，模拟跑动
          object.position.y = object.userData.runHeight * Math.sin(object.userData.runTime * 15);
          
          // 尾巴摆动
          if (object.userData.tail) {
            object.userData.tail.rotation.x = Math.sin(time * 3) * 0.2 + Math.PI / 4;
            object.userData.tail.rotation.z = Math.sin(time * 2) * 0.1;
          }
          
          // 移动和方向变化
          object.userData.changeDirCounter++;
          if (object.userData.changeDirCounter > object.userData.maxChangeDirCounter) {
            // 随机改变方向
            object.userData.direction = new THREE.Vector3(
              Math.random() - 0.5,
              0,
              Math.random() - 0.5
            ).normalize();
            
            // 重置计数器
            object.userData.changeDirCounter = 0;
            object.userData.maxChangeDirCounter = 50 + Math.floor(Math.random() * 150);
          }
          
          // 移动松鼠
          object.position.x += object.userData.direction.x * object.userData.speed;
          object.position.z += object.userData.direction.z * object.userData.speed;
          
          // 让松鼠朝向移动方向
          object.rotation.y = Math.atan2(object.userData.direction.x, object.userData.direction.z);
          break;
      }
    }
  });
} 