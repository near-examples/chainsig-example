import React, { CSSProperties } from 'react'
import clsx from 'clsx'

interface Props {
    className?: string
    size?: number
    color?: string
    speed?: number
    width?: number
    style?: CSSProperties
}

interface Styles extends CSSProperties {
    '--rl-spin-color': string
    '--rl-spin-size': string
    '--rl-spin-scale': number
    '--rl-spin-translate': string
    '--rl-spin-speed': string
    '--rl-spin-border': string
}

const Spin = ({
    className,
    // color = '#6CE89E',
    color = "rgb(29 78 216)",
    // color= 'black',
    size = 200,
    width = 5,
    speed = 2,
    style,
}: Props): JSX.Element => {
    const scale = size / 200
    const translate = size * scale
    const border = width * 4

    return (
        <div
            className={clsx('rl-spin', className)}
            style={
                {
                    '--rl-spin-size': `${size}px`,
                    '--rl-spin-color': color,
                    '--rl-spin-scale': scale,
                    '--rl-spin-translate': `${translate}px`,
                    '--rl-spin-speed': `${speed}s`,
                    '--rl-spin-border': `${border}px`,
                    transform: 'rotate(-34deg)',

                    ...style,
                } as Styles
            }
        >
            <div className={''}>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
            <div>
                <div></div>
            </div>
        </div>
    )
}

export default Spin