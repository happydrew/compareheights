import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Crop, Check, ZoomIn, ZoomOut } from 'lucide-react';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { UnitSystem, UNIT_CONVERSIONS } from './HeightCompareTool';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: {
    imageUrl: string;
    heightInM: number;
    widthInM?: number;
    aspectRatio: number;
  }) => void;
}

// 从裁剪区域获取裁剪后的图片
const getCroppedImg = async (
  image: HTMLImageElement,
  crop: CropArea,
  scale: number = 1
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL('image/png');
};

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [crop, setCrop] = useState<CropType>();
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<string>('1.8');
  const [width, setWidth] = useState<string>('');
  const [heightUnit, setHeightUnit] = useState<UnitSystem>(UnitSystem.METER);
  const [widthUnit, setWidthUnit] = useState<UnitSystem>(UnitSystem.METER);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 处理文件选择
  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      // 重置状态
      setCrop(undefined);
      setScale(1);
    }
  }, []);

  // 图片加载完成，设置初始裁剪区域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  // 单位转换到米
  const convertToMeters = (value: number, unit: UnitSystem): number => {
    return value / UNIT_CONVERSIONS[unit];
  };

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!selectedFile || !imageUrl || !crop || !imgRef.current) return;

    try {
      // 转换为像素裁剪区域
      const image = imgRef.current;
      const cropPixels: CropArea = {
        x: (crop.x / 100) * image.width,
        y: (crop.y / 100) * image.height,
        width: (crop.width / 100) * image.width,
        height: (crop.height / 100) * image.height,
      };
      
      // 生成裁剪后的图片
      const croppedImageUrl = await getCroppedImg(image, cropPixels, scale);
      
      // 计算尺寸
      const heightInM = convertToMeters(parseFloat(height), heightUnit);
      const widthInM = width ? convertToMeters(parseFloat(width), widthUnit) : undefined;
      const aspectRatio = cropPixels.width / cropPixels.height;

      onSave({
        imageUrl: croppedImageUrl,
        heightInM,
        widthInM,
        aspectRatio
      });

      // 重置状态
      setSelectedFile(null);
      setImageUrl('');
      setHeight('1.8');
      setWidth('');
      setCrop(undefined);
      setScale(1);
      
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('图片裁剪失败，请重试');
    }
  }, [selectedFile, imageUrl, crop, scale, height, width, heightUnit, widthUnit, onSave]);

  // 处理拖拽上传
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // 处理关闭
  const handleClose = useCallback(() => {
    // 清理URL对象
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    
    // 重置状态
    setSelectedFile(null);
    setImageUrl('');
    setHeight('1.8');
    setWidth('');
    setCrop(undefined);
    setScale(1);
    
    onClose();
  }, [imageUrl, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold">上传图片</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex gap-6 flex-1 min-h-0">
          {/* 左侧：图片裁剪区域 */}
          <div className="flex-1 flex flex-col">
            {!imageUrl ? (
              <div
                className="flex-1 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={48} className="text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">点击或拖拽上传图片</p>
                <p className="text-gray-400 text-sm">支持 JPG、PNG、GIF 格式</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {/* 图片裁剪区域 */}
                <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden min-h-0 flex items-center justify-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    aspect={undefined} // 允许自由比例
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      alt="Crop me"
                      style={{ 
                        transform: `scale(${scale})`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                </div>
                
                {/* 缩放控制 */}
                <div className="mt-4 bg-white rounded-lg p-3 border flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <ZoomOut size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-600 whitespace-nowrap">缩放:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-12">{Math.round(scale * 100)}%</span>
                    <ZoomIn size={16} className="text-gray-600" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：设置面板 */}
          <div className="w-80 border-l pl-6 flex flex-col">
            <div className="flex-1">
              <h3 className="font-semibold mb-4">尺寸设置</h3>
              
              {/* 高度设置 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">高度 *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0.001"
                  />
                  <select
                    value={heightUnit}
                    onChange={(e) => setHeightUnit(e.target.value as UnitSystem)}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={UnitSystem.NANOMETER}>nm</option>
                    <option value={UnitSystem.MICROMETER}>μm</option>
                    <option value={UnitSystem.MILLIMETER}>mm</option>
                    <option value={UnitSystem.CENTIMETER}>cm</option>
                    <option value={UnitSystem.METER}>m</option>
                    <option value={UnitSystem.KILOMETER}>km</option>
                    <option value={UnitSystem.INCH}>in</option>
                    <option value={UnitSystem.FOOT}>ft</option>
                    <option value={UnitSystem.MILE}>mi</option>
                  </select>
                </div>
              </div>

              {/* 宽度设置 */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">宽度（可选）</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                    min="0"
                    placeholder="自动计算"
                  />
                  <select
                    value={widthUnit}
                    onChange={(e) => setWidthUnit(e.target.value as UnitSystem)}
                    className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!width}
                  >
                    <option value={UnitSystem.NANOMETER}>nm</option>
                    <option value={UnitSystem.MICROMETER}>μm</option>
                    <option value={UnitSystem.MILLIMETER}>mm</option>
                    <option value={UnitSystem.CENTIMETER}>cm</option>
                    <option value={UnitSystem.METER}>m</option>
                    <option value={UnitSystem.KILOMETER}>km</option>
                    <option value={UnitSystem.INCH}>in</option>
                    <option value={UnitSystem.FOOT}>ft</option>
                    <option value={UnitSystem.MILE}>mi</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  如果不设置宽度，将根据裁剪后图片的宽高比自动计算
                </p>
              </div>

              {/* 裁剪说明 */}
              {imageUrl && (
                <div className="mb-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Crop size={16} className="mr-2" />
                    操作说明
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 拖拽裁剪框移动位置</li>
                    <li>• 拖拽裁剪框角落调整大小</li>
                    <li>• 使用滑块缩放图片 (10%-300%)</li>
                    <li>• 图片固定，只需调整裁剪框</li>
                  </ul>
                </div>
              )}

              {/* 重新选择图片 */}
              {imageUrl && (
                <div className="mb-4">
                  <button
                    onClick={() => {
                      if (imageUrl) {
                        URL.revokeObjectURL(imageUrl);
                      }
                      setSelectedFile(null);
                      setImageUrl('');
                      setCrop(undefined);
                      setScale(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                  >
                    重新选择图片
                  </button>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!imageUrl || !height || !crop}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Check size={16} className="mr-2" />
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ImageUploadModal };