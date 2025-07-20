export { getContentRect };

// 获取元素内容区域尺寸的工具函数
const getContentRect = (element: HTMLElement) => {
    const style = window.getComputedStyle(element);
    const paddingTop = parseFloat(style.paddingTop);
    const paddingBottom = parseFloat(style.paddingBottom);
    const paddingLeft = parseFloat(style.paddingLeft);
    const paddingRight = parseFloat(style.paddingRight);

    return {
        width: element.clientWidth - paddingLeft - paddingRight,
        height: element.clientHeight - paddingTop - paddingBottom,
        x: element.clientLeft + paddingLeft,
        y: element.clientTop + paddingTop
    };
};