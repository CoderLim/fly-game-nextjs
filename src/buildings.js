import * as THREE from 'three';

export function createBuildings() {
  const buildingsGroup = new THREE.Group();
  
  // 创建多个不同高度和位置的建筑物
  const citySize = 1000; // 城市大小
  const buildingCount = 5; // 建筑物数量，减少为原来的1/10
  
  // 建筑物材质
  const buildingMaterials = [
    new THREE.MeshPhongMaterial({ color: 0x555555, flatShading: true }), // 灰色
    new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true }), // 深灰色
    new THREE.MeshPhongMaterial({ color: 0x666666, flatShading: true }), // 浅灰色
    new THREE.MeshPhongMaterial({ color: 0x225577, flatShading: true }), // 蓝灰色
    new THREE.MeshPhongMaterial({ color: 0x775522, flatShading: true }), // 棕色
  ];
  
  // 窗户材质
  const windowMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffcc,
    emissive: 0x444444,
    flatShading: true
  });
  
  // 创建一个基础的建筑几何体
  function createBuildingWithWindows(width, height, depth) {
    const buildingGroup = new THREE.Group();
    
    // 主体
    const mainBuildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const material = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
    const mainBuilding = new THREE.Mesh(mainBuildingGeometry, material);
    mainBuilding.castShadow = true;
    mainBuilding.receiveShadow = true;
    buildingGroup.add(mainBuilding);
    
    // 添加窗户
    const windowSize = 2;
    const windowSpacing = 5;
    
    // 计算每一面的窗户数量
    const windowsX = Math.floor(width / windowSpacing) - 1;
    const windowsY = Math.floor(height / windowSpacing) - 1;
    const windowsZ = Math.floor(depth / windowSpacing) - 1;
    
    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.5);
    
    // 随机决定一些窗户是否亮着
    const windowChance = 0.7; // 70%的窗户是亮的
    
    // 在x轴方向的两个面添加窗户
    for (let y = 0; y < windowsY; y++) {
      for (let z = 0; z < windowsZ; z++) {
        if (Math.random() < windowChance) {
          // 前面
          const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
          frontWindow.position.set(-width/2 - 0.1, 
                                  -height/2 + y * windowSpacing + windowSpacing, 
                                  -depth/2 + z * windowSpacing + windowSpacing);
          buildingGroup.add(frontWindow);
        }
        
        if (Math.random() < windowChance) {
          // 后面
          const backWindow = new THREE.Mesh(windowGeometry, windowMaterial);
          backWindow.position.set(width/2 + 0.1,
                                -height/2 + y * windowSpacing + windowSpacing,
                                -depth/2 + z * windowSpacing + windowSpacing);
          backWindow.rotation.y = Math.PI;
          buildingGroup.add(backWindow);
        }
      }
    }
    
    // 在z轴方向的两个面添加窗户
    for (let y = 0; y < windowsY; y++) {
      for (let x = 0; x < windowsX; x++) {
        if (Math.random() < windowChance) {
          // 左面
          const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
          leftWindow.position.set(-width/2 + x * windowSpacing + windowSpacing,
                                 -height/2 + y * windowSpacing + windowSpacing,
                                 -depth/2 - 0.1);
          leftWindow.rotation.y = Math.PI / 2;
          buildingGroup.add(leftWindow);
        }
        
        if (Math.random() < windowChance) {
          // 右面
          const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
          rightWindow.position.set(-width/2 + x * windowSpacing + windowSpacing,
                                  -height/2 + y * windowSpacing + windowSpacing,
                                  depth/2 + 0.1);
          rightWindow.rotation.y = -Math.PI / 2;
          buildingGroup.add(rightWindow);
        }
      }
    }
    
    // 将组进行平移，使建筑物底部位于y=0的平面上
    buildingGroup.position.y = height / 2;
    
    return buildingGroup;
  }
  
  // 生成建筑并添加到组中
  for (let i = 0; i < buildingCount; i++) {
    // 随机建筑物尺寸
    const width = 10 + Math.random() * 20;
    const height = 20 + Math.random() * 180; // 摩天大楼，高度从20到200不等
    const depth = 10 + Math.random() * 20;
    
    // 随机位置
    const x = Math.random() * citySize - citySize / 2;
    const z = Math.random() * citySize - citySize / 2;
    
    // 创建建筑物
    const building = createBuildingWithWindows(width, height, depth);
    building.position.set(x, 0, z);
    
    // 随机旋转
    building.rotation.y = Math.random() * Math.PI * 2;
    
    buildingsGroup.add(building);
  }
  
  // 返回建筑物组
  return buildingsGroup;
} 