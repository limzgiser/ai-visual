// const MockAIContent =
  // "以下是一个使用 ECharts 的完整 HTML 示例，包含一个简单的柱状图：\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <title>ECharts Demo</title>\n    \x3C!-- 引入 ECharts -->\n    \x3Cscript src=\"https://cdn.staticfile.org/echarts/5.4.2/echarts.min.js\">\x3C/script>\n</head>\n<body>\n    \x3C!-- 图表容器 -->\n    <div id=\"main\" style=\"width: 100%;height:400px;\"></div>\n\n    \x3Cscript type=\"text/javascript\">\n        // 初始化图表\n        window.onload = function() {\n            // 基于准备好的dom，初始化echarts实例\n            var myChart = echarts.init(document.getElementById('main'));\n\n            // 指定图表的配置项和数据\n            var option = {\n                title: {\n                    text: '示例柱状图'\n                },\n                tooltip: {},\n                legend: {\n                    data: ['销量']\n                },\n                xAxis: {\n                    data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']\n                },\n                yAxis: {},\n                series: [{\n                    name: '销量',\n                    type: 'bar',\n                    data: [5, 20, 36, 10, 10, 20]\n                }]\n            };\n\n            // 使用刚指定的配置项和数据显示图表\n            myChart.setOption(option);\n        }\n    \x3C/script>\n</body>\n</html>\n```\n\n使用方法：\n1. 将代码保存为 `.html` 文件（如 `demo.html`）\n2. 用浏览器打开即可看到效果\n\n这个示例包含：\n- 一个简单的柱状图\n- 标题、图例、提示框\n- 横坐标为服装品类\n- 纵坐标为销量数据\n- 响应式容器（600x400 像素）\n\n如果要修改图表：\n1. 调整 `data` 数组中的数据\n2. 修改 `xAxis.data` 中的分类名称\n3. 调整容器 div 的尺寸\n4. 修改 `title.text` 的标题内容\n\n支持所有现代浏览器（Chrome/Firefox/Safari/Edge 等），需要保持网络通畅以加载 ECharts 库。"
const MockAIContent = '请输入您的需求进行图表绘制，尽量描述的清晰、准确。'
export { MockAIContent }
