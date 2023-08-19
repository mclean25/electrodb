import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Entity } from '../';
import {expect} from "chai";
import {v4 as uuid} from "uuid";
const u = require('../src/util');

type ConversionTest = {
    item: any;
    keys: any;
    success: boolean;
    target: 'byCategory' | 'byOrganization' | 'top';
    description: string;
    error: string;
    strict?: 'all' | 'pk' | 'none';
}

const conversionTests: ConversionTest[] = require('./conversions');

const client = new DocumentClient({
    endpoint: process.env.LOCAL_DYNAMO_ENDPOINT ?? 'http://localhost:8000',
    region: 'us-east-1',
});

describe('conversions', () => {
    const table = 'electro';
    const serviceName = uuid();
    const entity = new Entity({
        model: {
            entity: uuid(),
            version: '1',
            service: serviceName
        },
        attributes: {
            organizationId: {
                type: 'string'
            },
            accountId: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            city: {
                type: 'string'
            },
            county: {
                type: 'string'
            },
            state: {
                type: 'string'
            },
            count: {
                type: 'number'
            },
            kind: {
                type: 'string'
            }
        },
        indexes: {
            defaultKeyStructure: {
                collection: 'defaultKeyCollection',
                pk: {
                    field: 'pk',
                    composite: ['organizationId', 'state']
                },
                sk: {
                    field: 'sk',
                    composite: ['accountId', 'name']
                }
            },
            customKeyStructure: {
                collection: 'customKeyCollection',
                index: 'gsi1pk-gsi1sk-index',
                pk: {
                    field: 'gsi1pk',
                    composite: ['name'],
                    template: 'location#${name}',
                },
                sk: {
                    field: 'gsi1sk',
                    composite: ['state', 'county', 'city'],
                    template: "state#${state}#county#${county}#city#${city}e1"
                }
            },
            pkOnlyDefaultKeyStructure: {
                index: 'gsi2pk-gsi2sk-index',
                pk: {
                    field: 'gsi2pk',
                    composite: ['organizationId', 'state']
                },
            },
            pkOnlyCustomKeyStructure: {
                index: 'gsi3pk-gsi3sk-index',
                pk: {
                    field: 'gsi3pk',
                    composite: ['name'],
                    template: 'location#${name}',
                },
            },
            attributeRefKeyStructure: {
                collection: 'attributeRefKeyStructureCollection',
                index: 'gsi4pk-gsi4sk-index',
                pk: {
                    field: 'gsi4pk',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi4sk',
                    composite: ['count'],
                    template: '${count}'
                }
            },

            defaultKeyStructureClustered: {
                type: 'clustered',
                index: 'gsi5pk-gsi5sk-index',
                collection: 'defaultKeyClusteredCollection',
                pk: {
                    field: 'gsi5pk',
                    composite: ['organizationId', 'state']
                },
                sk: {
                    field: 'gsi5sk',
                    composite: ['accountId', 'name']
                }
            },
            customKeyStructureClustered: {
                type: 'clustered',
                collection: 'customKeyClusteredCollection',
                index: 'gsi6pk-gsi6sk-index',
                pk: {
                    field: 'gsi6pk',
                    composite: ['name'],
                    template: 'location#${name}',
                },
                sk: {
                    field: 'gsi6sk',
                    composite: ['state', 'county', 'city'],
                    template: "state#${state}#county#${county}#city#${city}e1"
                }
            },
            attributeRefKeyStructureClustered: {
                type: 'clustered',
                collection: 'attributeRefKeyStructureClusteredCollectionClustered',
                index: 'gsi9pk-gsi9sk-index',
                pk: {
                    field: 'gsi9pk',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi9sk',
                    composite: ['count'],
                    template: '${count}'
                }
            },

            defaultKeyStructureClusteredCaseless: {
                type: 'clustered',
                index: 'gsi10pk-gsi10sk-index',
                collection: 'defaultKeyClusteredCaselessCollection',
                pk: {
                    field: 'gsi10pk',
                    composite: ['organizationId', 'state'],
                    casing: 'none',
                },
                sk: {
                    field: 'gsi10sk',
                    composite: ['accountId', 'name'],
                    casing: 'none',
                }
            },
            customKeyStructureClusteredCaseless: {
                type: 'clustered',
                collection: 'customKeyClusteredCaselessCollection',
                index: 'gsi11pk-gsi11sk-index',
                pk: {
                    field: 'gsi11pk',
                    composite: ['name'],
                    template: 'location#${name}',
                    casing: 'none',
                },
                sk: {
                    field: 'gsi11sk',
                    composite: ['state', 'county', 'city'],
                    casing: 'none',
                    template: "state#${state}#county#${county}#city#${city}e1"
                }
            },
            pkOnlyDefaultKeyStructureClusteredCaseless: {
                index: 'gsi12pk-gsi12sk-index',
                pk: {
                    field: 'gsi12pk',
                    casing: 'none',
                    composite: ['organizationId', 'state']
                },
            },
            pkOnlyCustomKeyStructureClusteredCaseless: {
                index: 'gsi13pk-gsi13sk-index',
                pk: {
                    field: 'gsi13pk',
                    casing: 'none',
                    composite: ['name'],
                    template: 'location#${name}',
                },
            },
            attributeRefKeyStructureClusteredCaseless: {
                type: 'clustered',
                collection: 'attributeRefKeyStructureClusteredCollection',
                index: 'gsi14pk-gsi14sk-index',
                pk: {
                    field: 'gsi14pk',
                    casing: 'none',
                    composite: ['kind'],
                    template: '${kind}',
                },
                sk: {
                    field: 'gsi14sk',
                    casing: 'none',
                    composite: ['count'],
                    template: '${count}'
                }
            }
        }
    }, { table, client });

    const validateMatchingCorrespondence = (options: {
        label: string;
        pkComposite: string[],
        skComposite: string[],
        provided: Record<string, any>,
        composite: Record<string, any>
    }): void => {
        const {label, pkComposite, skComposite, composite, provided} = options;
        try {
            expect(pkComposite.length + skComposite.length).to.be.greaterThan(0);
            expect(Object.keys(provided).length).to.be.greaterThan(0);
            expect(Object.keys(composite).length).to.be.greaterThan(0);

            for (const attribute of pkComposite) {
                const compositeValue = composite[attribute];
                expect(compositeValue).to.not.be.undefined;

                const itemValue = provided[attribute];
                expect(itemValue).to.not.be.undefined;
                expect(`${itemValue}`.toLowerCase()).to.equal(`${compositeValue}`.toLowerCase());
            }
            let skBroken = false;
            for (const attribute of skComposite) {
                const compositeValue = composite[attribute];

                const itemValue = provided[attribute];

                if (itemValue === undefined) {
                    skBroken = true;
                }

                if (compositeValue === undefined && itemValue !== undefined) {
                    throw new Error('Composite broken but should not be');
                }

                expect(`${itemValue}`.toLowerCase()).to.equal(`${compositeValue}`.toLowerCase());
            }
        } catch(err: any) {
            err.message = `${label}: ${err.message}`;
            throw err;
        }
    }

    const evaluateFromComposite = (item: typeof record) => {
        const cursor = entity.conversions.fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keys = entity.conversions.fromComposite.toKeys(item);
        expect(keys).not.to.be.null;

        const cursorFromKeys = entity.conversions.fromKeys.toCursor(keys!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const keysFromCursor = entity.conversions.fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const compositeFromCursor = entity.conversions.fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        const compositeFromKeys = entity.conversions.fromKeys.toComposite(keys!);
        expect(compositeFromKeys).not.to.be.null;
        expect(keys).to.deep.equal(keysFromCursor);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);

        for (const [accessPattern, definition] of Object.entries(entity.schema.indexes)) {
            try {
                validateMatchingCorrespondence({
                    label: `${accessPattern} from cursor`,
                    skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                    pkComposite: definition.pk.composite,
                    composite: compositeFromCursor!,
                    provided: item
                });

                validateMatchingCorrespondence({
                    label: `${accessPattern} from keys`,
                    skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                    pkComposite: definition.pk.composite,
                    composite: compositeFromKeys!,
                    provided: item
                });
            } catch(err) {
                console.log({
                    decodedCursor: u.cursorFormatter.deserialize(cursor),
                    item,
                    cursor,
                    keys,
                    cursorFromKeys,
                    keysFromCursor,
                    compositeFromCursor,
                    compositeFromKeys,
                })
                throw err;
            }
        }
    }

    const evaluateFromKeys = (keys: any) => {
        const item = entity.conversions.fromKeys.toComposite(keys);
        if (!item) {
            throw new Error('Item not defined!');
        }
        // @ts-ignore
        const cursor = entity.conversions.fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keysFromCursor = entity.conversions.fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const cursorFromKeys = entity.conversions.fromKeys.toCursor(keysFromCursor!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const compositeFromCursor = entity.conversions.fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        // @ts-ignore
        const keysFromComposite = entity.conversions.fromComposite.toKeys(item);
        expect(keysFromComposite).not.to.be.null;
        expect(keysFromCursor).to.deep.equal(keysFromComposite);

        const compositeFromKeys = entity.conversions.fromKeys.toComposite(keysFromComposite!);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
        expect(!!compositeFromKeys).to.be.true;
        for (const [accessPattern, definition] of Object.entries(entity.schema.indexes)) {
            try {
                validateMatchingCorrespondence({
                    label: `${accessPattern} from cursor`,
                    skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                    pkComposite: definition.pk.composite,
                    composite: compositeFromCursor!,
                    provided: item
                });

                validateMatchingCorrespondence({
                    label: `${accessPattern} from keys`,
                    skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                    pkComposite: definition.pk.composite,
                    composite: compositeFromKeys!,
                    provided: item
                });
            } catch(err) {
                console.log({
                    decodedCursor: u.cursorFormatter.deserialize(cursor),
                    keys,
                    item,
                    cursor,
                    cursorFromKeys,
                    keysFromCursor,
                    compositeFromCursor,
                    keysFromComposite,
                    compositeFromKeys,
                    definition,
                })
                throw err;
            }
        }
    }

    const evaluateAccessPattern = (accessPattern: keyof typeof entity.schema.indexes, item: typeof record) => {
        const cursor = entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keys = entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(item);
        expect(keys).not.to.be.null;

        const cursorFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toCursor(keys!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const keysFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const compositeFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        const compositeFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(keys!);
        expect(compositeFromKeys).not.to.be.null;
        expect(keys).to.deep.equal(keysFromCursor);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
        const definition = entity.schema.indexes[accessPattern];
        try {
            validateMatchingCorrespondence({
                label: `${accessPattern} from cursor`,
                skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                pkComposite: definition.pk.composite,
                composite: compositeFromCursor!,
                provided: item
            });

            validateMatchingCorrespondence({
                label: `${accessPattern} from keys`,
                skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                pkComposite: definition.pk.composite,
                composite: compositeFromKeys!,
                provided: item
            });
        } catch(err) {
            console.log({
                decodedCursor: u.cursorFormatter.deserialize(cursor),
                accessPattern,
                item,
                cursor,
                keys,
                cursorFromKeys,
                keysFromCursor,
                compositeFromCursor,
                compositeFromKeys,
                definition,
            });
            throw err;
        }
    }

    const evaluateAccessPatternFromKeys = (accessPattern: keyof typeof entity.schema.indexes, keys: any) => {
        const item = entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(keys);
        if (!item) {
            throw new Error('Item not defined!');
        }
        // @ts-ignore
        const cursor = entity.conversions.byAccessPattern[accessPattern].fromComposite.toCursor(item);
        expect(cursor).not.to.be.null;

        const keysFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toKeys(cursor!);
        expect(keysFromCursor).not.to.be.null;

        const cursorFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toCursor(keysFromCursor!);
        expect(cursorFromKeys).not.to.be.null;
        expect(cursor).to.equal(cursorFromKeys);

        const compositeFromCursor = entity.conversions.byAccessPattern[accessPattern].fromCursor.toComposite(cursor!);
        expect(compositeFromCursor).not.to.be.null;

        // @ts-ignore
        const keysFromComposite = entity.conversions.byAccessPattern[accessPattern].fromComposite.toKeys(item);
        expect(keysFromComposite).not.to.be.null;
        expect(keysFromCursor).to.deep.equal(keysFromComposite);

        expect(Object.entries(compositeFromCursor!).length).to.be.greaterThan(0);
        const compositeFromKeys = entity.conversions.byAccessPattern[accessPattern].fromKeys.toComposite(keysFromComposite!);
        expect(!!compositeFromKeys).to.be.true;

        const definition = entity.schema.indexes[accessPattern];
        try {
            validateMatchingCorrespondence({
                label: `${accessPattern} from cursor`,
                skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                pkComposite: definition.pk.composite,
                composite: compositeFromCursor!,
                provided: item
            });

            validateMatchingCorrespondence({
                label: `${accessPattern} from keys`,
                skComposite: 'sk' in definition && definition.sk.composite ? definition.sk.composite : [],
                pkComposite: definition.pk.composite,
                composite: compositeFromKeys!,
                provided: item
            });
        } catch(err) {
            console.log({
                accessPattern,
                keys,
                item,
                cursor,
                cursorFromKeys,
                keysFromCursor,
                compositeFromCursor,
                keysFromComposite,
                compositeFromKeys,
                definition,
            })
            throw err;
        }
    }

    const record = {
        name: 'nameProperty',
        accountId: 'accountIdProperty',
        organizationId: 'organizationIdProperty',
        city: 'cityProperty',
        county: 'countyProperty',
        state: 'stateProperty',
        count: 10,
        kind: 'kindProperty',
    };

    describe('top-level conversions', () => {

        it('should perform all conversions without loss starting with an item', () => {
            evaluateFromComposite(record);
        });

        it('should perform all conversions without loss starting with keys', () => {
            const params = entity.put(record).params();
            const keys = params.Item;
            for (const prop in params.Item) {
                if (prop.startsWith('gsi') || prop === 'pk' || prop === 'sk') {
                    keys[prop] = params.Item[prop];
                }
            }
            evaluateFromKeys(keys);
        });

        describe('should create keys based on strictness', () => {
            const table = uuid();
            const entityName = 'conversionentity';
            const serviceName = 'conversionservice';
            const entity = new Entity({
                model: {
                    service: serviceName,
                    entity: entityName,
                    version: '1',
                },
                attributes: {
                    accountId: {
                        type: 'string'
                    },
                    organizationId: {
                        type: 'string'
                    },
                    id: {
                        type: 'string'
                    },
                    category: {
                        type: 'string',
                    },
                    createdAt: {
                        type: 'number'
                    },
                    name: {
                        type: 'string',
                    },
                    description: {
                        type: 'string',
                    }
                },
                indexes: {
                    byOrganization: {
                        pk: {
                            field: 'pk',
                            composite: ['organizationId'],
                        },
                        sk: {
                            field: 'sk',
                            composite: ['accountId', 'id']
                        }
                    },
                    byCategory: {
                        index: 'gsi1pk-gsi1sk-index',
                        pk: {
                            field: 'gsi1pk',
                            composite: ['category']
                        },
                        sk: {
                            field: 'gsi1sk',
                            composite: ['createdAt', 'name']
                        }
                    }
                }
            }, {table});

            function getConversion(target: ConversionTest['target'], strict?: 'all' | 'pk' | 'none') {
                switch (target) {
                    case "byCategory":
                        return (composite: any) => entity.conversions.byAccessPattern.byCategory.fromComposite.toKeys(composite, {strict});
                    case "byOrganization":
                        return (composite: any) => entity.conversions.byAccessPattern.byOrganization.fromComposite.toKeys(composite, {strict});
                    case "top":
                        return (composite: any) => entity.conversions.fromComposite.toKeys(composite, {strict});
                    default:
                        throw new Error(`Unknown target: "${target}"`);
                }
            }

            for (const test of conversionTests) {
                it(test.description, () => {
                    const conversion = getConversion(test.target, test.strict);
                    try {
                        const keys = conversion(test.item);
                        expect(keys).to.deep.equal(test.keys);
                    } catch (err: any) {
                        expect(err.message).to.deep.equal(test.error);
                    }
                });
            }
        });
    });

    describe('byAccessPattern conversions', () => {
        const accessPatterns = [
            ['has default electrodb key structure', 'defaultKeyStructure'],
            ['has custom key structure using template', 'customKeyStructure'],
            ['has default key structure but with only a pk', 'pkOnlyDefaultKeyStructure'],
            ['has custom key structure with template but with only a pk', 'pkOnlyCustomKeyStructure'],
            ['has direct attribute reference key', 'attributeRefKeyStructure'],
            ['has default key structure but on a clustered index', 'defaultKeyStructureClustered'],
            ['has custom key structure but with a clustered index', 'customKeyStructureClustered'],
            ['has direct attribute reference but with index defined as clustered', 'attributeRefKeyStructureClustered'],
            ['has default key structure but on a clustered index and caseless keys', 'defaultKeyStructureClusteredCaseless'],
            ['has custom key structure but with a clustered index and caseless keys', 'customKeyStructureClusteredCaseless'],
            ['has default key structure but with only a pk and caseless keys', 'pkOnlyDefaultKeyStructureClusteredCaseless'],
            ['has custom key structure with template but with only a pk and caseless keys', 'pkOnlyCustomKeyStructureClusteredCaseless'],
            ['has direct attribute reference key and caseless keys', 'attributeRefKeyStructureClusteredCaseless'],
        ] as const;

        const record = {
            name: 'nameProperty',
            accountId: 'accountIdProperty',
            organizationId: 'organizationIdProperty',
            city: 'cityProperty',
            county: 'countyProperty',
            state: 'stateProperty',
            count: 10,
            kind: 'kindProperty',
        };

        for (let i = 0; i < accessPatterns.length; i++) {
            const [description, accessPattern] = accessPatterns[i];

            it(`should perform all conversions without loss starting with an item for an index that ${description}`, () => {
                evaluateAccessPattern(accessPattern, record);
            });

            it(`should perform all conversions without loss starting with keys for an index that ${description}`, () => {
                const params = entity.put(record).params();
                const keys: Record<string, string | number> = {};
                for (const prop in params.Item) {
                    if (prop.startsWith('gsi') || prop === 'pk' || prop === 'sk') {
                        keys[prop] = params.Item[prop];
                    }
                }

                expect(Object.keys(keys).length).to.equal(22);

                evaluateAccessPatternFromKeys(accessPattern, keys);
            });
        }

    });
});

describe('key formatting', () => {
    describe('pre and post fixing attribute reference keys', () => {
        // it('should always correctly add prefixes and postfixes to keys - issue#225', () => {
            const table = "your_table_name";

            const createEntity = (options: {
                pkTemplate: string;
                skTemplate: string;
                pkCasing: 'upper' | 'lower' | 'none' | 'default';
                skCasing: 'upper' | 'lower' | 'none' | 'default';
            }) => {
                const {skTemplate, pkTemplate, pkCasing, skCasing} = options;
                return new Entity(
                    {
                        model: {
                            entity: 'notification',
                            version: '1',
                            service: 'notifications',
                        },
                        attributes: {
                            userId: {
                                type: 'string',
                            },
                            message: {
                                type: 'string',
                            },
                            time: {
                                type: 'string',
                            },
                        },
                        indexes: {
                            byUserId: {
                                pk: {
                                    field: 'userId',
                                    template: pkTemplate,
                                    composite: ['userId'],
                                    casing: pkCasing,
                                },
                                sk: {
                                    field: 'requestId',
                                    template: skTemplate,
                                    composite: ['time'],
                                    casing: skCasing,
                                },
                            },
                        },
                    },
                    {
                        table,
                    },
                );
            }

            const casings = [
                'none',
                'upper',
                'lower',
                'default',
            ] as const;

            const fixings = [
                ['prefix-', ''],
                ['', '-postfix'],
                ['prefix-', '-postfix'],
                ['', ''],
            ];

            function createTemplates(key: string) {
                const templates: [string, (test: string, val: string) => void][] = [];
                for (const [prefix, postfix] of fixings) {
                    let template = '${' + key + '}';
                    if (prefix) {
                        template = prefix + template;
                    }
                    if (postfix) {
                        template = template + postfix;
                    }
                    const test = (test: string, val: string) => {
                        const prefixIsValid = (!prefix || val.toLowerCase().startsWith(prefix.toLowerCase()));
                        const postfixIsValid = (!postfix || val.toLowerCase().endsWith(postfix.toLowerCase()));
                        const skException = test.startsWith('sk');

                        if (prefixIsValid && (postfixIsValid || skException)) {
                            return;
                        }

                        throw new Error(`${test}. Expected ${test} value "${val}" to have prefix "${prefix || '(NONE)'}" and postfix "${postfix || '(NONE)'}"`);
                    }
                    templates.push([template, test]);
                }
                return templates;
            }

        const pkTemplates = createTemplates('userId');
        const skTemplates = createTemplates('time');
        const pkCasing = 'default' as const;
        const skCasing = 'default' as const;

        for (const pkCasing of casings) {
            for (const skCasing of casings) {
                for (const [pkTemplate, pkTest] of pkTemplates) {
                    for (const [skTemplate, skTest] of skTemplates) {
                        const entity = createEntity({
                            skTemplate: skTemplate,
                            pkTemplate: pkTemplate,
                            pkCasing,
                            skCasing,
                        });

                        describe(`when pk casing is ${pkCasing}, sk casing is ${skCasing}, the pk template is ${pkTemplate}, or the sk template is ${skTemplate}`, () => {
                            it('should perform begins with query', () => {
                                const queryParams1 = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).params();

                                pkTest('pk', queryParams1['ExpressionAttributeValues'][':pk']);
                                if (skTemplate[0] !== '$') {
                                    skTest('sk', queryParams1['ExpressionAttributeValues'][':sk1']);
                                }
                            });

                            it('should perform a gte query', () => {
                                const queryParamsGte = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).gte({time: "2022-01-01T00:00:00.000Z"}).params();
                                // queryParamsGte).to.equal('brad-01-no;
                                pkTest('pk', queryParamsGte['ExpressionAttributeValues'][':pk']);
                                if (queryParamsGte['ExpressionAttributeValues'][':sk1']) {
                                    skTest('sk', queryParamsGte['ExpressionAttributeValues'][':sk1']);
                                }
                            });
                            it('should perform a gt query', () => {
                                const queryParamsGt = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).gt({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsGt).to.equal('brad-01-no;
                                pkTest('pk', queryParamsGt['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsGt['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a lte query', () => {
                                const queryParamsLte = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).lte({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsLte).to.equal(';
                                pkTest('pk', queryParamsLte['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsLte['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a lt query', () => {
                                const queryParamsLt = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).lt({time: "2022-01-01T00:00:00.000Z"})
                                    .params();
                                // queryParamsLt).to.equal(';
                                pkTest('pk', queryParamsLt['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsLt['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a between query', () => {
                                const queryParamsBetween = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).between(
                                    {time: "2022-01-01T00:00:00.000Z"},
                                    {time: "2023-01-01T00:00:00.000Z"},
                                ).params();

                                // queryParamsBetween).to.equal(';
                                pkTest('pk', queryParamsBetween['ExpressionAttributeValues'][':pk']);
                                skTest('sk1', queryParamsBetween['ExpressionAttributeValues'][':sk1']);
                                skTest('sk2', queryParamsBetween['ExpressionAttributeValues'][':sk2']);
                            });

                            it('should perform a begins with query', () => {
                                const queryParamsBegins = entity.query.byUserId({
                                    userId: 'Brad-01',
                                }).begins({
                                    time: "2022-01-01",
                                }).params();
                                // queryParamsBegins).to.equal(';
                                pkTest('pk', queryParamsBegins['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsBegins['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a full equality with query', () => {
                                const queryParamsBegins = entity.query.byUserId({
                                    userId: 'Brad-01',
                                    time: "2022-01-01",
                                }).params();
                                // queryParamsBegins).to.equal(';
                                pkTest('pk', queryParamsBegins['ExpressionAttributeValues'][':pk']);
                                skTest('sk', queryParamsBegins['ExpressionAttributeValues'][':sk1']);
                            });

                            it('should perform a create operation', () => {
                                // expected - pk is brad-01-notification
                                const createParams = entity.create({
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z',
                                    message: "Hi"
                                }).params();
                                // createParams).to.equal(';
                                pkTest('pk', createParams.Item.userId);
                                skTest('sk', createParams.Item.requestId);
                            });

                            it('should perform a batch put operation', () => {
                                const batchPutParams = entity.put([{
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z',
                                    message: "Hi"
                                }]).params();
                                pkTest('pk', batchPutParams[0].RequestItems[table][0].PutRequest.Item.userId);
                                skTest('sk', batchPutParams[0].RequestItems[table][0].PutRequest.Item.requestId);
                            });

                            it('should perform an update', () => {
                                const updateParams = entity.update({
                                    userId: 'Brad-01',
                                    time: '2020-01-01T00:00:00.000Z'
                                }).set({
                                    message: "Hello"
                                }).params();

                                pkTest('pk', updateParams.Key.userId);
                                skTest('sk', updateParams.Key.requestId);
                            });

                            it('should perform a get operation', () => {
                                const getParams = entity.get({
                                    time: "123",
                                    userId: "Brad-01"
                                }).params();

                                pkTest('pk', getParams['Key']['userId']);
                                skTest('sk', getParams['Key']['requestId']);
                            });

                            it('should perform a batch get operation', () => {
                                const batchGetParams = entity.get([{
                                    time: "123",
                                    userId: "Brad-01"
                                }]).params();
                                pkTest('pk', batchGetParams[0].RequestItems[table].Keys[0].userId);
                                skTest('sk', batchGetParams[0].RequestItems[table].Keys[0].requestId);
                            });
                        });
                    }
                }
            }
        }
    });
});

describe('static template key ownership', () => {
    it('should return items when no composite attributes are in the key templates', async () => {
        const table = 'electro';
        const ProductSchema = new Entity({
            model: {
                entity: 'Product',
                version: '1',
                service: 'aa',
            },
            attributes: {
                name: {
                    type: 'string',
                },
                enabled: {
                    type: 'boolean'
                }
            },
            indexes: {
                primary: {
                    pk: {
                        field: 'pk',
                        casing: 'none',
                        template: '#PRODUCTS',
                        composite: [],
                    },
                    sk: {
                        field: 'sk',
                        casing: 'none',
                        template: '#PRODUCTS',
                        composite: [],
                    },
                },
            },
        },{ table, client});

        const item = {
            pk: '#PRODUCTS',
            sk: '#PRODUCTS',
            enabled: true,
            name: uuid(),
        }
    
        await client.put({
            Item: item,
            TableName: table
        }).promise();

        const getResults = await ProductSchema
            .get({})
            .go({ ignoreOwnership: true });

        expect(getResults.data).to.deep.equal({
            enabled: item.enabled,
            name: item.name,
        });

        const queryResults = await ProductSchema.query
            .primary({})
            .go({ignoreOwnership: true});

        expect(queryResults.data[0]).to.deep.equal({
            enabled: item.enabled,
            name: item.name,
        });
    });

    it('should return items when no composite attributes are in the key templates and no sk', async () => {
        const table = 'electro_nosort';
        const ProductSchema = new Entity({
            model: {
                entity: 'Product',
                version: '1',
                service: 'aa',
            },
            attributes: {
                name: {
                    type: 'string',
                },
                enabled: {
                    type: 'boolean'
                }
            },
            indexes: {
                primary: {
                    pk: {
                        field: 'partition_key',
                        casing: 'none',
                        template: '#PRODUCTS',
                        composite: [],
                    }
                },
            },
        },{ table, client});

        const item = {
            partition_key: '#PRODUCTS',
            enabled: true,
            name: uuid(),
        }
    
        await client.put({
            Item: item,
            TableName: table
        }).promise();

        const results = await ProductSchema
            .get({})
            .go({ ignoreOwnership: true });

        expect(results.data).to.deep.equal({
            enabled: item.enabled,
            name: item.name,
        });
    });
});

describe('index casting', () => {
    it('should not allow "number" cast to be used when more than one composite attribute is used with composites', () => {
        const gameId = uuid();
        const gamerTag = uuid();
        const timestamp = Date.now();
        const score = 500;

        const item = {
            gameId, 
            gamerTag, 
            timestamp, 
            score,
        }

        const table = 'electro_castkeys';
        expect(() => new Entity({
            model: {
                entity: "HighScore",
                version: "1",
                service: "Leaderboard"
            },
            attributes: {
                gameId: {
                    type: 'string'
                },
                gamerTag: {
                    type: "string",
                },
                timestamp: {
                    type: "number",
                },
                score: {
                    type: "number",
                },
            },
            indexes: {
                castToNumber: {
                    pk: {
                        field: "pk",
                        cast: 'string',
                        composite: ["gamerTag"],
                    },
                    sk: {
                        field: "sk",
                        cast: 'number',
                        composite: ["score", "timestamp"]
                    }
                }
            }
        }, { table, client })).to.throw('Invalid "cast" option provided for sk definition on index "(Primary Index)". Keys can only be cast to \'number\' if they are a composite of one numeric attribute. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model');
    });

    it('should not allow "number" cast to be used when more than one composite attribute is used with templates', () => {
        const gameId = uuid();
        const gamerTag = uuid();
        const timestamp = Date.now();
        const score = 500;

        const item = {
            gameId, 
            gamerTag, 
            timestamp, 
            score,
        }

        const table = 'electro_castkeys';
        expect(() => new Entity({
            model: {
                entity: "HighScore",
                version: "1",
                service: "Leaderboard"
            },
            attributes: {
                gameId: {
                    type: 'string'
                },
                gamerTag: {
                    type: "string",
                },
                timestamp: {
                    type: "number",
                },
                score: {
                    type: "number",
                },
            },
            indexes: {
                castToNumber: {
                    pk: {
                        field: "pk",
                        cast: 'string',
                        composite: ["gamerTag"],
                    },
                    sk: {
                        field: "sk",
                        cast: 'number',
                        composite: ["score", "timestamp"],
                        template: '${score}#${timestamp}'
                    }
                }
            }
        }, { table, client })).to.throw('Invalid "cast" option provided for sk definition on index "(Primary Index)". Keys can only be cast to \'number\' if they are a composite of one numeric attribute. - For more detail on this error reference: https://electrodb.dev/en/reference/errors/#invalid-model');
    });

    it('should reject when provided string index composite cannot be cast to number', () => {
        const gamerTag = uuid();

        const table = 'electro_castkeys';
        const booleanHighScore = new Entity({
            model: {
                entity: "BooleanHighScore",
                version: "1",
                service: "Leaderboard"
            },
            attributes: {
                gamerTag: {
                    type: "string",
                },
                score: {
                    type: "boolean",
                },
            },
            indexes: {
                castToNumber: {
                    pk: {
                        field: "pk",
                        cast: 'string',
                        composite: ["gamerTag"],
                    },
                    sk: {
                        field: "sk",
                        cast: 'number',
                        composite: ["score"]
                    }
                }
            }
        }, { table, client });

        const stringHighScore = new Entity({
            model: {
                entity: "stringHighScore",
                version: "1",
                service: "Leaderboard"
            },
            attributes: {
                gamerTag: {
                    type: "string",
                },
                score: {
                    type: "string",
                },
            },
            indexes: {
                castToNumber: {
                    pk: {
                        field: "pk",
                        cast: 'string',
                        composite: ["gamerTag"],
                    },
                    sk: {
                        field: "sk",
                        cast: 'number',
                        composite: ["score"]
                    }
                }
            }
        }, { table, client });

        const successCases = [
            {
                expected: 1,
                params: booleanHighScore.put({gamerTag, score: true}).params(),
            },
            {
                expected: 0,
                params: booleanHighScore.put({gamerTag, score: false}).params(),
            },
            {
                expected: 1,
                params: stringHighScore.put({gamerTag, score: '1'}).params(),
            },
            {
                expected: 100,
                params: stringHighScore.put({gamerTag, score: '100'}).params(),
            },
            {
                expected: 50,
                params: stringHighScore.put({gamerTag, score: '0050'}).params(),
            },
        ];

        for (const successCase of successCases) {
            expect(successCase.params.Item.sk).to.equal(successCase.expected);
        }

        expect(() => stringHighScore.put({gamerTag, score: 'abc'}).params()).to.throw('');
    });

    it('should allow for more granular control to choose how they can type their keys', async () => {
        const table = 'electro_castkeys';        
        const highScore = new Entity({
            model: {
                entity: "HighScore",
                version: "1",
                service: "Leaderboard"
            },
            attributes: {
                gameId: {
                    type: 'string'
                },
                gamerTag: {
                    type: "string",
                },
                timestamp: {
                    type: "number",
                },
                score: {
                    type: "number",
                },
            },
            indexes: {
                castToNumber: {
                    pk: {
                        field: "pk",
                        cast: 'number',
                        composite: ["score"],
                    },
                    sk: {
                        field: "sk",
                        cast: 'number',
                        composite: ["timestamp"]
                    }
                },
                castToNumberNoSk: {
                    index: "gsi2pk-gsi2sk-index",
                    pk: {
                        field: "gsi2pk",
                        cast: 'number',
                        composite: ['score'],
                    },
                },
                castViaTemplate: {
                    index: "gsi3pk-gsi3sk-index",
                    pk: {
                        field: "gsi3pk",
                        composite: ['score'],
                        template: '${score}',
                    },
                    sk: {
                        field: "gsi3sk",
                        composite: ['timestamp'],
                        template: '${timestamp}'
                    }
                },
                castToString: {
                    index: "gsi4pk-gsi4sk-index",
                    pk: {
                        field: "gsi4pk",
                        cast: 'string',
                        composite: ['score'],
                        template: '${score}',
                        
                    },
                    sk: {
                        field: "gsi4sk",
                        cast: 'string',
                        composite: ['timestamp'],
                        template: '${timestamp}',
                    }
                },
                castToStringNoSk: {
                    index: "gsi5pk-gsi5sk-index",
                    pk: {
                        field: "gsi5pk",
                        cast: 'string',
                        composite: ['score'],
                        template: '${score}',
                        
                    }
                },
            }
        }, { table, client });

        const gameId = uuid();
        const gamerTag = uuid();
        const timestamp = Date.now();
        const score = 500;

        const item = {
            gameId, 
            gamerTag, 
            timestamp, 
            score,
        }

        const params = highScore.put(item).params();
        expect(params.Item).to.deep.equal({
            __edb_e__: "HighScore",
            __edb_v__: "1",
            gameId,
            gamerTag,
            timestamp,
            score,
            pk: score,
            sk: timestamp,
            gsi2pk: score,
            gsi3pk: score,
            gsi3sk: timestamp,
            gsi4pk: `${score}`,
            gsi4sk: `${timestamp}`,
            gsi5pk: `${score}`,
        });

        await highScore.put(item).go();

        const castToNumber = await highScore.query.castToNumber({score, timestamp}).go().then(r => r.data[0]);
        expect(castToNumber).to.deep.equal(item);

        const castToNumberNoSk = await highScore.query.castToNumberNoSk({score}).go().then(r => r.data[0]);
        expect(castToNumberNoSk).to.deep.equal(item);

        const castViaTemplate = await highScore.query.castViaTemplate({score, timestamp}).go().then(r => r.data[0]);
        expect(castViaTemplate).to.deep.equal(item);

        const castToString = await highScore.query.castToString({score, timestamp}).go().then(r => r.data[0]);
        expect(castToString).to.deep.equal(item);

        const castToStringNoSk = await highScore.query.castToStringNoSk({score}).go().then(r => r.data[0]);
        expect(castToStringNoSk).to.deep.equal(item);
    });
});

describe('attribute watch', () => {
   it("should use an attribute's field name when updating an attribute via 'watch'", () => {
       const tasks = new Entity(
           {
               model: {
                   entity: "tasks",
                   version: "1",
                   service: "taskapp",
               },
               attributes: {
                   id: { type: "string" },
                   expiresAt: { type: "string" },
                   localFieldName: {
                       type: "string",
                       field: "TTL", // This should be used when updating
                       watch: ["expiresAt"],
                       set: (_, { expiresAt }) => expiresAt.split('').reverse().join(''),
                   },
               },
               indexes: {
                   byId: {
                       pk: { field: "PK", composite: ["id"] },
                       sk: { field: "SK", composite: [] },
                   },
               },
           },
           { table: "taskapp" },
       );

       const expiresAt = 'abc';
       const params1 = tasks.update({ id: "test" }).set({ expiresAt }).params();
       expect(params1).to.deep.equal({
           "UpdateExpression": "SET #expiresAt = :expiresAt_u0, #TTL = :TTL_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
           "ExpressionAttributeNames": {
               "#expiresAt": "expiresAt",
               "#TTL": "TTL",
               "#id": "id",
               "#__edb_e__": "__edb_e__",
               "#__edb_v__": "__edb_v__"
           },
           "ExpressionAttributeValues": {
               ":expiresAt_u0": 'abc',
               ":TTL_u0": 'cba',
               ":id_u0": "test",
               ":__edb_e___u0": "tasks",
               ":__edb_v___u0": "1"
           },
           "TableName": "taskapp",
           "Key": {
               "PK": "$taskapp#id_test",
               "SK": "$tasks_1"
           }
       });

       const params2 = tasks.update({ id: "test" }).set({ expiresAt, localFieldName: '1' }).params();
       expect(params2).to.deep.equal({
           "UpdateExpression": "SET #expiresAt = :expiresAt_u0, #localFieldName = :localFieldName_u0, #id = :id_u0, #__edb_e__ = :__edb_e___u0, #__edb_v__ = :__edb_v___u0",
           "ExpressionAttributeNames": {
               "#expiresAt": "expiresAt",
               "#localFieldName": "TTL",
               "#id": "id",
               "#__edb_e__": "__edb_e__",
               "#__edb_v__": "__edb_v__"
           },
           "ExpressionAttributeValues": {
               ":expiresAt_u0": "abc",
               ":localFieldName_u0": "cba",
               ":id_u0": "test",
               ":__edb_e___u0": "tasks",
               ":__edb_v___u0": "1"
           },
           "TableName": "taskapp",
           "Key": {
               "PK": "$taskapp#id_test",
               "SK": "$tasks_1"
           }
       });
   });
});

describe('sparse index formatting', () => {
   it('when keys are attribute names, should not produce empty string pk key', () => {
       const table = "your_table_name";
       const tasks = new Entity(
           {
               model: {
                   entity: "tasks",
                   version: "1",
                   service: "taskapp"
               },
               attributes: {
                   team: {
                       type: "string",
                       required: true
                   },
                   task: {
                       type: "string",
                       required: false
                   },
                   code: {
                       type: "string",
                       required: false,
                   },
               },
               indexes: {
                   projects: {
                       pk: {
                           field: "pk",
                           composite: ["team"]
                       },

                   },

                   withCode: {
                       // sparse index that should only be populated if code set
                       index: "with-code-index",
                       pk: {
                           field: "code",
                           composite: ["code"]
                       },
                       sk: {
                           field: "task",
                           composite: ["task"]
                       }
                   }
               }
           },
           { table }
       );

       const params1 = tasks.put({ team: 'team', task: undefined }).params();
       expect(params1).to.deep.equal({
           "Item": {
               "team": "team",
               "pk": "$taskapp$tasks_1#team_team",
               "__edb_e__": "tasks",
               "__edb_v__": "1"
           },
           "TableName": "your_table_name"
       });

       const params2 = tasks.put({ team: 'team' }).params();
       expect(params2).to.deep.equal({
           "Item": {
               "team": "team",
               "pk": "$taskapp$tasks_1#team_team",
               "__edb_e__": "tasks",
               "__edb_v__": "1"
           },
           "TableName": "your_table_name"
       });

       const params3 = tasks.put({ team: 'team', task: 'abc' }).params();
       expect(params3).to.deep.equal({
           "Item": {
               "team": "team",
               "task": "abc",
               "pk": "$taskapp$tasks_1#team_team",
               "__edb_e__": "tasks",
               "__edb_v__": "1"
           },
           "TableName": "your_table_name"
       });

       const params4 = tasks.put({ team: 'team', code: 'abc' }).params();
       expect(params4).to.deep.equal({
           "Item": {
               "team": "team",
               "code": "abc",
               "pk": "$taskapp$tasks_1#team_team",
               "__edb_e__": "tasks",
               "__edb_v__": "1"
           },
           "TableName": "your_table_name"
       });
   });
});
