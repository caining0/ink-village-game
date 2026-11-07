# 工笔女主实现

1. 在 humanoid.js 为 heroine 增加柔化头部 SDF 与正面 UV，不改变其他角色；在 humanoidBuild.js 独立打包 face 材质。
2. 在 charm​at.js 添加工笔脸部纹理材质；fighter.js 仅将女主身体衣料改为柔和分阶光照，衣料取消粗布格纹。
3. 在 heroine.js 添加额前与两侧发束、花枝衣纹；沿用已有骨骼和布料。
4. 新建 character.html 与 character-preview.js，显示同一真实模型，支持旋转与脸部近景；首页链接到检视页。
5. 验证全部测试、语法、生成几何有限性及 UV；浏览器检查脸部贴图与侧面，然后再检查游戏。
