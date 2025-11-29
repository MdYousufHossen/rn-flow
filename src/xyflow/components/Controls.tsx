import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useStore } from '../store/ReactFlowContext';
import type { ControlsProps } from '../types';

const getPositionStyles = (position: string) => {
  switch (position) {
    case 'top-left':
      return { top: 10, left: 10 };
    case 'top-right':
      return { top: 10, right: 10 };
    case 'bottom-right':
      return { bottom: 10, right: 10 };
    case 'bottom-left':
    default:
      return { bottom: 10, left: 10 };
  }
};

// Icon components
const ZoomInIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5V19M5 12H19"
      stroke="#333"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ZoomOutIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19"
      stroke="#333"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const FitViewIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4H8M4 4V8M4 4L9 9M20 4H16M20 4V8M20 4L15 9M4 20H8M4 20V16M4 20L9 15M20 20H16M20 20V16M20 20L15 15"
      stroke="#333"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 11V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V11M12 15V17M7 11H17C18.1046 11 19 11.8954 19 13V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V13C5 11.8954 5.89543 11 7 11Z"
      stroke="#333"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const UnlockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 7C17 4.23858 14.7614 2 12 2C9.53949 2 7.49942 3.79437 7.08296 6.15058M12 15V17M7 11H17C18.1046 11 19 11.8954 19 13V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V13C5 11.8954 5.89543 11 7 11Z"
      stroke="#333"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ControlsComponent: React.FC<ControlsProps> = ({
  showZoom = true,
  showFitView = true,
  showInteractive = true,
  fitViewOptions,
  onZoomIn,
  onZoomOut,
  onFitView,
  onInteractiveChange,
  position = 'bottom-left',
  style,
}) => {
  const { zoomIn, zoomOut, fitView, nodesDraggable } = useStore();
  const [isInteractive, setIsInteractive] = useState(true);

  const handleZoomIn = () => {
    zoomIn();
    onZoomIn?.();
  };

  const handleZoomOut = () => {
    zoomOut();
    onZoomOut?.();
  };

  const handleFitView = () => {
    fitView(fitViewOptions);
    onFitView?.();
  };

  const handleInteractiveChange = () => {
    const newValue = !isInteractive;
    setIsInteractive(newValue);
    onInteractiveChange?.(newValue);
  };

  const positionStyles = getPositionStyles(position);

  return (
    <View style={[styles.container, positionStyles, style]}>
      {showZoom && (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={handleZoomIn}
            activeOpacity={0.7}
          >
            <ZoomInIcon />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleZoomOut}
            activeOpacity={0.7}
          >
            <ZoomOutIcon />
          </TouchableOpacity>
        </>
      )}
      {showFitView && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleFitView}
          activeOpacity={0.7}
        >
          <FitViewIcon />
        </TouchableOpacity>
      )}
      {showInteractive && (
        <TouchableOpacity
          style={[styles.button, !isInteractive && styles.buttonActive]}
          onPress={handleInteractiveChange}
          activeOpacity={0.7}
        >
          {isInteractive ? <UnlockIcon /> : <LockIcon />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonActive: {
    backgroundColor: '#e3e3e3',
  },
});

ControlsComponent.displayName = 'Controls';

export const Controls = ControlsComponent;
export default Controls;
