const sizesTheme = {
	borderRadiusLG:		15,
	borderRadius:		10,
	borderRadiusSM:		10,
	borderRadiusOuter:	7,
	borderRadiusXS:		5,

	controlHeightLG: 40,
	controlHeightSM: 24,
	controlHeightXS: 16,

	fontSizeHeading1: 20,
	fontSizeHeading2: 18,
	fontSizeHeading3: 16,
	fontSizeHeading4: 14,
	fontSizeHeading5: 12,

	fontSizeXL: 20,
	fontSizeLG: 16,
	fontSize: 	14,
	fontSizeSM: 12,
	fontSizeXS: 10,

	fontSizeIcon:12,

	sizeXXL:	48,
	sizeXL:		32,
	sizeLG:		24,
	sizeMD:		20,
	size:		16,
	sizeMS:		16,
	sizeSM:		12,
	sizeXS:		8,
	sizeXXS:	4,

	marginXXL:	48,
	marginXL:	32,
	marginLG:	24,
	marginMD:	20,
	margin:		16,
	marginSM:	12,
	marginXS:	8,
	marginXXS:	4,

	paddingXL:	20,
	paddingLG:	16,
	paddingMD:	14,
	padding:	10,
	paddingSM:	10,
	paddingXS:	5,
	paddingXXS:	3,

	paddingContentHorizontalLG:	16,
	paddingContentHorizontal:	10,
	paddingContentHorizontalSM:	8,

	paddingContentVerticalLG:	16,
	paddingContentVertical:		10,
	paddingContentVerticalSM:	8,
}

export const darkTheme = {
	cssVar: true,
	components: {
		Button: {
			defaultShadow: "none",
			dangerShadow: "none",
			primaryShadow: "none"
		},
		Input: {
			activeBg: 'hsl(225, 7%, 25%)',
			hoverBg: 'hsl(225, 7%, 25%)',
			colorFillTertiary: "hsl(225, 7%, 17%)",
		}
	},
	token: {
		boxShadow: '0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05)',
		boxShadowSecondary: '0 3px 6px -4px rgba(0,0,0,0.12), 0 6px 16px 0 rgba(0,0,0,0.08), 0 9px 28px 8px rgba(0,0,0,0.05)',
		boxShadowTertiary: '0 1px 2px -2px rgba(0,0,0,0.16), 0 3px 6px 0 rgba(0,0,0,0.12), 0 5px 12px 4px rgba(0,0,0,0.09)',

		headerGap: "2rem",
		mainGap: '.5rem',

		colorBgLayout:			"hsl(225, 7%, 0%)",
		colorBgContainer:		"hsl(225, 7%, 10%)",
		colorBgElevated:		"hsl(225, 7%, 17%)",
	
		colorFill:				"hsl(225, 7%, 10%)",
		colorFillSecondary:		"hsl(225, 7%, 17%)",
		colorFillTertiary:		"hsl(225, 7%, 25%)",
		colorFillQuaternary:	"hsl(225, 7%, 40%)",

		colorBgMask:			"hsla(225, 7%, 1%, .45)",

		colorBgSolid:			"hsla(225, 7%, 15%, 1)",
		colorBgSolidHover:		"hsla(225, 7%, 25%, 1)",
		colorBgSolidActive:		"hsla(225, 7%, 25%, 1)",

		colorTextBase:			"hsl(225, 44%, 96%)",
		colorTextLabel:			"hsl(225, 44%, 96%)",
		colorTextHeading: 		"hsl(225, 44%, 96%)",
		colorText: 				"hsl(225, 7%, 70%)",
		colorTextDescription:	"hsl(225, 7%, 55%)",
		colorTextPlaceholder:	"hsl(225, 7%, 55%)",
		colorTextSecondary:		"hsl(225, 7%, 55%)",
		colorTextTertiary:		"hsl(225, 7%, 45%)",
		colorTextQuaternary:	"hsl(225, 7%, 35%)",
		colorTextDisabled:		"hsl(225, 7%, 35%)",

		colorTextLightSolid:	"hsl(213, 78%, 1%)",

		colorIcon:				"hsl(225, 7%, 70%)",
		colorIconHover:			"hsl(225, 44%, 96%)",

		colorBgTextActive:		"hsl(225, 7%, 70%)",
		colorBgTextHover:		"hsl(225, 7%, 70%)",

		colorLink: 				"hsl(225, 7%, 70%)",
		colorLinkActive:		"hsl(225, 7%, 55%)",
		colorLinkHover:			"hsl(225, 7%, 55%)",

		colorSplit: 			"hsl(225, 7%, 20%)",
		colorBorder: 			"hsl(225, 7%, 20%)",
		colorBorderBg:			"hsl(225, 7%, 20%)",
		colorBorderSecondary:	"hsl(225, 7%, 40%)",

		colorError: 			"hsl(4, 100%, 70%)",
		colorErrorHover:		"hsl(4, 100%, 60%)",
		colorErrorActive: 		"hsl(4, 100%, 70%)",
		colorErrorBg: 			"hsl(4, 100%, 7%)",
		colorErrorBgActive:		"hsl(4, 100%, 15%)",
		colorErrorBgHover: 		"hsl(4, 100%, 15%)",
		colorErrorBgFilledHover:"hsl(4, 100%, 25%)",
		colorErrorBorder:		"hsl(4, 100%, 50%)",
		colorErrorOutline:		"hsl(4, 100%, 50%)",
		colorErrorBorderHover:	"hsl(4, 100%, 60%)",
		colorErrorText:			"hsl(4, 100%, 70%)",
		colorErrorTextActive:	"hsl(4, 100%, 85%)",
		colorErrorTextHover:	"hsl(4, 100%, 85%)",

		colorPrimary: 			"hsl(217, 100%, 70%)",
		colorPrimaryHover:		"hsl(217, 100%, 60%)",
		colorPrimaryActive:		"hsl(217, 100%, 60%)",
		colorPrimaryBg:			"hsl(217, 100%, 9%)",
		colorPrimaryBgActive:	"hsl(217, 100%, 15%)",
		colorPrimaryBgHover:	"hsl(217, 100%, 15%)",
		colorPrimaryBorder:		"hsl(217, 100%, 50%)",
		colorPrimaryBorderHover:"hsl(217, 100%, 60%)",
		colorPrimaryText:		"hsl(217, 100%, 70%)",
		colorPrimaryTextActive:	"hsl(217, 100%, 85%)",
		colorPrimaryTextHover:	"hsl(217, 100%, 85%)",

		colorInfo:				"hsl(217, 80%, 70%)",
		colorInfoHover:			"hsl(217, 100%, 60%)",
		colorInfoActive:		"hsl(217, 100%, 60%)",
		colorInfoBg:			"hsl(217, 100%, 9%)",
		colorInfoBgActive:		"hsl(217, 100%, 15%)",
		colorInfoBgHover: 		"hsl(217, 100%, 15%)",
		colorInfoBgFilledHover:	"hsl(217, 100%, 25%)",
		colorInfoBorder: 		"hsl(217, 100%, 50%)",
		colorInfoBorderHover:	"hsl(217, 100%, 60%)",
		colorInfoText:			"hsl(217, 100%, 70%)",
		colorInfoTextActive:	"hsl(217, 100%, 85%)",
		colorInfoTextHover:		"hsl(217, 100%, 85%)",

		colorSuccess:			"hsl(146, 100%, 70%)",
		colorSuccessHover:		"hsl(146, 100%, 60%)",
		colorSuccessActive:		"hsl(146, 100%, 70%)",
		colorSuccessBg:			"hsl(146, 100%, 7%)",
		colorSuccessBgActive:	"hsl(146, 100%, 15%)",
		colorSuccessBgHover: 	"hsl(146, 100%, 15%)",
		colorSuccessBgFilledHover:"hsl(146, 100%, 25%)",
		colorSuccessBorder:		"hsl(146, 100%, 50%)",
		colorSuccessBorderHover:"hsl(146, 100%, 60%)",
		colorSuccessText:		"hsl(146, 100%, 70%)",
		colorSuccessTextActive:	"hsl(146, 100%, 85%)",
		colorSuccessTextHover:	"hsl(146, 100%, 100%)",

		colorWarning:			"hsl(30, 100%, 70%)",
		colorWarningHover:		"hsl(30, 100%, 60%)",
		colorWarningActive:		"hsl(30, 100%, 70%)",
		colorWarningBg:			"hsl(30, 100%, 7%)",
		colorWarningBgActive:	"hsl(30, 100%, 15%)",
		colorWarningBgHover: 	"hsl(30, 100%, 15%)",
		colorWarningBgFilledHover:"hsl(30, 100%, 25%)",
		colorWarningBorder: 	"hsl(30, 100%, 50%)",
		colorWarningOutline:	"hsl(30, 100%, 50%)",
		colorWarningBorderHover:"hsl(30, 100%, 60%)",
		colorWarningText:		"hsl(30, 100%, 70%)",
		colorWarningTextActive:	"hsl(30, 100%, 85%)",
		colorWarningTextHover:	"hsl(30, 100%, 85%)",

		...sizesTheme
	},
}


export const lightTheme = {
	cssVar: true,
	components: {
		Button: {
			defaultShadow: "none",
			dangerShadow: "none",
			primaryShadow: "none"
		},
		Input: {
			activeBg: 'hsl(225, 7%, 75%)',
			hoverBg: 'hsl(225, 7%, 75%)',
			colorFillTertiary: "hsl(225, 7%, 83%)",
		}
	},
	token: {
		boxShadow: '0 6px 16px 0 hsla(225, 7%, 50%, .08), 0 3px 6px -4px hsla(225, 7%, 50%, .12), 0 9px 28px 8px hsla(225, 7%, 50%, .05)',
		boxShadowSecondary: '0 3px 6px -4px hsla(225, 7%, 50%, .12), 0 6px 16px 0 hsla(225, 7%, 50%, .08), 0 9px 28px 8px hsla(225, 7%, 50%, .05)',
		boxShadowTertiary: '0 1px 2px -2px hsla(225, 7%, 50%, .16), 0 3px 6px 0 hsla(225, 7%, 50%, .12), 0 5px 12px 4px hsla(225, 7%, 50%, .09)',

		headerGap: "2rem",
		mainGap: '.5rem',

		colorBgLayout:			"hsl(225, 7%, 100%)",
		colorBgContainer:		"hsl(225, 7%, 90%)",
		colorBgElevated:		"hsl(225, 7%, 83%)",
	
		colorFill:				"hsl(225, 7%, 90%)",
		colorFillSecondary:		"hsl(225, 7%, 83%)",
		colorFillTertiary:		"hsl(225, 7%, 75%)",
		colorFillQuaternary:	"hsl(225, 7%, 60%)",

		colorBgMask:			"hsla(225, 7%, 99%, .45)",

		colorBgSolid:			"hsla(225, 7%, 85%, 1)",
		colorBgSolidHover:		"hsla(225, 7%, 75%, 1)",
		colorBgSolidActive:		"hsla(225, 7%, 75%, 1)",

		colorTextBase:			"hsl(225, 44%, 4%)",
		colorTextLabel:			"hsl(225, 44%, 4%)",
		colorTextHeading: 		"hsl(225, 44%, 4%)",
		colorText: 				"hsl(225, 7%, 30%)",
		colorTextDescription:	"hsl(225, 7%, 40%)",
		colorTextPlaceholder:	"hsl(225, 7%, 40%)",
		colorTextSecondary:		"hsl(225, 7%, 40%)",
		colorTextTertiary:		"hsl(225, 7%, 50%)",
		colorTextQuaternary:	"hsl(225, 7%, 60%)",
		colorTextDisabled:		"hsl(225, 7%, 60%)",

		colorTextLightSolid:	"hsl(213, 78%, 99%)",

		colorIcon:				"hsl(225, 7%, 30%)",
		colorIconHover:			"hsl(225, 44%, 4%)",

		colorBgTextActive:		"hsl(225, 7%, 30%)",
		colorBgTextHover:		"hsl(225, 7%, 30%)",

		colorLink: 				"hsl(225, 7%, 30%)",
		colorLinkActive:		"hsl(225, 7%, 45%)",
		colorLinkHover:			"hsl(225, 7%, 45%)",

		colorSplit: 			"hsl(225, 7%, 80%)",
		colorBorder: 			"hsl(225, 7%, 80%)",
		colorBorderBg:			"hsl(225, 7%, 80%)",
		colorBorderSecondary:	"hsl(225, 7%, 60%)",

		colorError: 			"hsl(4, 100%, 70%)",
		colorErrorHover:		"hsl(4, 100%, 60%)",
		colorErrorActive: 		"hsl(4, 100%, 70%)",
		colorErrorBg: 			"hsl(4, 100%, 95%)",
		colorErrorBgActive:		"hsl(4, 100%, 85%)",
		colorErrorBgHover: 		"hsl(4, 100%, 85%)",
		colorErrorBgFilledHover:"hsl(4, 100%, 75%)",
		colorErrorBorder:		"hsl(4, 100%, 50%)",
		colorErrorOutline:		"hsl(4, 100%, 50%)",
		colorErrorBorderHover:	"hsl(4, 100%, 40%)",
		colorErrorText:			"hsl(4, 100%, 30%)",
		colorErrorTextActive:	"hsl(4, 100%, 15%)",
		colorErrorTextHover:	"hsl(4, 100%, 15%)",

		colorPrimary: 			"hsl(217, 100%, 70%)",
		colorPrimaryHover:		"hsl(217, 100%, 60%)",
		colorPrimaryActive:		"hsl(217, 100%, 60%)",
		colorPrimaryBg:			"hsl(217, 100%, 95%)",
		colorPrimaryBgActive:	"hsl(217, 100%, 85%)",
		colorPrimaryBgHover:	"hsl(217, 100%, 85%)",
		colorPrimaryBorder:		"hsl(217, 100%, 50%)",
		colorPrimaryBorderHover:"hsl(217, 100%, 40%)",
		colorPrimaryText:		"hsl(217, 100%, 30%)",
		colorPrimaryTextActive:	"hsl(217, 100%, 15%)",
		colorPrimaryTextHover:	"hsl(217, 100%, 15%)",

		colorInfo:				"hsl(217, 100%, 70%)",
		colorInfoHover:			"hsl(217, 100%, 60%)",
		colorInfoActive:		"hsl(217, 100%, 60%)",
		colorInfoBg:			"hsl(217, 100%, 95%)",
		colorInfoBgActive:		"hsl(217, 100%, 85%)",
		colorInfoBgHover: 		"hsl(217, 100%, 85%)",
		colorInfoBgFilledHover:	"hsl(217, 100%, 75%)",
		colorInfoBorder: 		"hsl(217, 100%, 50%)",
		colorInfoBorderHover:	"hsl(217, 100%, 40%)",
		colorInfoText:			"hsl(217, 100%, 30%)",
		colorInfoTextActive:	"hsl(217, 100%, 15%)",
		colorInfoTextHover:		"hsl(217, 100%, 15%)",

		colorSuccess:			"hsl(146, 100%, 70%)",
		colorSuccessHover:		"hsl(146, 100%, 60%)",
		colorSuccessActive:		"hsl(146, 100%, 70%)",
		colorSuccessBg:			"hsl(146, 100%, 95%)",
		colorSuccessBgActive:	"hsl(146, 100%, 85%)",
		colorSuccessBgHover: 	"hsl(146, 100%, 85%)",
		colorSuccessBgFilledHover:"hsl(146, 100%, 75%)",
		colorSuccessBorder:		"hsl(146, 100%, 50%)",
		colorSuccessBorderHover:"hsl(146, 100%, 40%)",
		colorSuccessText:		"hsl(146, 100%, 30%)",
		colorSuccessTextActive:	"hsl(146, 100%, 15%)",
		colorSuccessTextHover:	"hsl(146, 100%, 15%)",

		colorWarning:			"hsl(30, 100%, 70%)",
		colorWarningHover:		"hsl(30, 100%, 60%)",
		colorWarningActive:		"hsl(30, 100%, 70%)",
		colorWarningBg:			"hsl(30, 100%, 95%)",
		colorWarningBgActive:	"hsl(30, 100%, 85%)",
		colorWarningBgHover: 	"hsl(30, 100%, 85%)",
		colorWarningBgFilledHover:"hsl(30, 100%, 75%)",
		colorWarningBorder: 	"hsl(30, 100%, 50%)",
		colorWarningOutline:	"hsl(30, 100%, 50%)",
		colorWarningBorderHover:"hsl(30, 100%, 40%)",
		colorWarningText:		"hsl(30, 100%, 30%)",
		colorWarningTextActive:	"hsl(30, 100%, 15%)",
		colorWarningTextHover:	"hsl(30, 100%, 15%)",

		...sizesTheme
	},
}